require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const dbPromise = require('./database.js');
const authRoutes = require('./authRoutes.js');

const app = express();

// Sua configuração do limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Você tinha mudado para 5, mantive aqui
    message: { mensagem: 'Muitas tentativas de login a partir deste IP, por favor, tente novamente após 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Sua função de autenticação
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
        return res.status(401).send({ mensagem: 'Token inválido ou expirado.' });
    }
};

// Middlewares gerais
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rotas de Autenticação com o limiter condicional
if (process.env.NODE_ENV !== 'test') {
    app.use('/auth', loginLimiter, authRoutes);
} else {
    app.use('/auth', authRoutes);
}

// Middleware de autenticação para as rotas de segredos
app.use('/segredos', autenticar);

// --- ROTAS DE SEGREDOS ---

app.get('/segredos', async (req, res) => {
    const db = await dbPromise;
    const segredos = await db.all('SELECT * FROM segredos WHERE usuario_id = ?', [req.usuario.id]);
    res.json(segredos);
});

app.post('/segredos', async (req, res) => {
    const db = await dbPromise;
    const { segredo } = req.body;
    if (!segredo || segredo.trim() === '') {
        return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
    }
    const resultado = await db.run('INSERT INTO segredos (texto, usuario_id) VALUES (?, ?)', [segredo, req.usuario.id]);
    res.status(201).send({ mensagem: 'Segredo adicionado com sucesso!', id: resultado.lastID });
});

app.put('/segredos/:id', async (req, res) => {
    const db = await dbPromise;
    const { segredo } = req.body;
    if (!segredo || segredo.trim() === '') {
        return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
    }
    const resultado = await db.run('UPDATE segredos SET texto = ? WHERE id = ? AND usuario_id = ?', [segredo, req.params.id, req.usuario.id]);
    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado ou você não tem permissão para editá-lo.' });
    }
    res.status(200).send({ mensagem: 'Segredo atualizado com sucesso!' });
});

app.delete('/segredos/:id', async (req, res) => {
    const db = await dbPromise;
    const resultado = await db.run('DELETE FROM segredos WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado ou você não tem permissão para deletá-lo.' });
    }
    res.status(204).send();
});

module.exports = app;