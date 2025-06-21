// app.js VERSÃO FINAL E CORRIGIDA

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
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
        next(error); // Passa o erro para a central de erros
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

// --- ROTAS DE SEGREDOS COM A LÓGICA COMPLETA E TRATAMENTO DE ERRO ---

app.get('/segredos', async (req, res, next) => {
    try {
        const db = await dbPromise;
        const segredos = await db.all('SELECT * FROM segredos WHERE usuario_id = ?', [req.usuario.id]);
        res.json(segredos);
    } catch (error) {
        next(error);
    }
});

app.post('/segredos', async (req, res, next) => {
    try {
        const db = await dbPromise;
        const { segredo } = req.body;
        if (!segredo || segredo.trim() === '') {
             const error = new Error('O segredo não pode ser vazio.');
             error.status = 400;
             throw error;
        }
        const resultado = await db.run('INSERT INTO segredos (texto, usuario_id) VALUES (?, ?)', [segredo, req.usuario.id]);
        const novoSegredo = await db.get('SELECT * FROM segredos WHERE id = ?', [resultado.lastID]);
        res.status(201).json(novoSegredo);
    } catch (error) {
        next(error);
    }
});

app.put('/segredos/:id', async (req, res, next) => {
    try {
        const db = await dbPromise;
        const { segredo } = req.body;
        if (!segredo || segredo.trim() === '') {
            const error = new Error('O segredo não pode ser vazio.');
            error.status = 400;
            throw error;
        }
        const resultado = await db.run('UPDATE segredos SET texto = ? WHERE id = ? AND usuario_id = ?', [segredo, req.params.id, req.usuario.id]);
        if (resultado.changes === 0) {
            const error = new Error('Segredo não encontrado ou você não tem permissão para editá-lo.');
            error.status = 404;
            throw error;
        }
        res.status(200).send({ mensagem: 'Segredo atualizado com sucesso!' });
    } catch (error) {
        next(error);
    }
});

app.delete('/segredos/:id', async (req, res, next) => {
    try {
        const db = await dbPromise;
        const resultado = await db.run('DELETE FROM segredos WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
        if (resultado.changes === 0) {
            const error = new Error('Segredo não encontrado ou você não tem permissão para deletá-lo.');
            error.status = 404;
            throw error;
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// --- NOSSA CENTRAL DE EMERGÊNCIA (MIDDLEWARE DE ERRO) ---
app.use((error, req, res, next) => {
    logger.error({ /* ...seu logger ... */ });
    if (error instanceof ZodError) { /* ... */ }
    if (error.code === 'SQLITE_CONSTRAINT') { /* ... */ }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) { /*...*/ }
    if (error.status) {
        return res.status(error.status).send({ mensagem: error.message });
    }
    return res.status(500).send({ mensagem: 'Ocorreu um erro inesperado no servidor.' });
});

module.exports = app;