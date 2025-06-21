// app.js CORRIGIDO E FINAL

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { z, ZodError } = require('zod'); // <-- IMPORTAÇÃO CONSOLIDADA AQUI
const dbPromise = require('./database.js');
const logger = require('./logger.js');
const authRoutes = require('./authRoutes.js');

const app = express();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { mensagem: 'Muitas tentativas de login a partir deste IP, por favor, tente novamente após 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const autenticar = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ mensagem: 'Token de autenticação não fornecido ou mal formatado.' });
        }
        const token = authHeader.split(' ')[1];
        const usuarioVerificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = usuarioVerificado;
        next();
    } catch (error) {
        // Agora este erro será pego pela nossa central!
        next(error);
    }
};

app.use(express.json());
app.use(cors());
app.use(helmet());

if (process.env.NODE_ENV !== 'test') {
    app.use('/auth', loginLimiter, authRoutes);
} else {
    app.use('/auth', authRoutes);
}
app.use('/segredos', autenticar);

// --- ROTAS DE SEGREDOS ---
// (Suas rotas de segredos GET, POST, PUT, DELETE ficam aqui, sem alterações)
app.get('/segredos', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });
app.post('/segredos', async (req, res, next) => {
    try {
        const db = await dbPromise;
        const { segredo } = req.body;
        if (!segredo || segredo.trim() === '') {
            return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
        }

        const resultado = await db.run('INSERT INTO segredos (texto, usuario_id) VALUES (?, ?)', [segredo, req.usuario.id]);

        // BUSCA O OBJETO COMPLETO QUE ACABOU DE SER CRIADO
        const novoSegredo = await db.get('SELECT * FROM segredos WHERE id = ?', [resultado.lastID]);

        // RETORNA O OBJETO COMPLETO
        res.status(201).json(novoSegredo);
    } catch (e) {
        next(e);
    }
});
app.put('/segredos/:id', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });
app.delete('/segredos/:id', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });


// --- NOSSA NOVA CENTRAL DE EMERGÊNCIA (MIDDLEWARE DE ERRO) ---
// Este DEVE ser o último middleware
app.use((error, req, res, next) => {
    logger.error(error); // Sempre logamos o erro

    // Se for um erro de validação do Zod
    if (error instanceof ZodError) {
        return res.status(400).send({ mensagem: "Dados de entrada inválidos.", erros: error.errors });
    }

    // Se for um erro de conflito do banco (email duplicado)
    if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).send({ mensagem: 'Conflito de dados. O email, por exemplo, já pode estar em uso.' });
    }

    // Se for um erro que nós criamos com um status específico (como na rota de login)
    if (error.status) {
        return res.status(error.status).send({ mensagem: error.message });
    }

    // Para todos os outros erros, uma resposta genérica
    return res.status(500).send({ mensagem: 'Ocorreu um erro inesperado no servidor.' });
});

module.exports = app;