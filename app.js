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
app.post('/segredos', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });
app.put('/segredos/:id', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });
app.delete('/segredos/:id', async (req, res, next) => { try { /* ... */ } catch(e) { next(e) } });


// --- CENTRAL DE EMERGÊNCIA (MIDDLEWARE DE ERRO) ---
app.use((error, req, res, next) => {
    logger.error({
        mensagem: error.message,
        stack: error.stack,
        rota: req.path,
        metodo: req.method
    });

    if (error instanceof ZodError) {
        return res.status(400).send({ mensagem: "Dados de entrada inválidos.", erros: error.errors });
    }

    if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).send({ mensagem: 'Conflito de dados. O email, por exemplo, já pode estar em uso.' });
    }

    // Adicionamos uma verificação para erros de Token inválido/expirado
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return res.status(401).send({ mensagem: 'Token inválido ou expirado.' });
    }

    return res.status(500).send({ mensagem: 'Ocorreu um erro inesperado no servidor.' });
});

module.exports = app;