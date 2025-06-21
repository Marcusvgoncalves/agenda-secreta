// app.js REFATORADO COM PRISMA

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
const prisma = require('./lib/prisma.js'); // Importamos nossa instância do Prisma
const logger = require('./logger.js');
const authRoutes = require('./authRoutes.js');

const app = express();

// ... (Seu loginLimiter e middleware autenticar continuam aqui, sem alterações) ...
const loginLimiter = rateLimit({/*...*/});
const autenticar = (req, res, next) => {/*...*/};

app.use(express.json());
app.use(cors());
app.use(helmet());

// ... (Sua lógica de 'if (process.env.NODE_ENV !== 'test')' continua aqui) ...
if (process.env.NODE_ENV !== 'test') { app.use('/auth', loginLimiter, authRoutes) } else { app.use('/auth', authRoutes) }

app.use('/segredos', autenticar);

// --- ROTAS DE SEGREDOS COM PRISMA ---

app.get('/segredos', async (req, res, next) => {
    try {
        const segredos = await prisma.secret.findMany({
            where: { authorId: req.usuario.id }, // Prisma usa 'authorId' como definimos no schema
        });
        res.json(segredos);
    } catch (error) {
        next(error);
    }
});

app.post('/segredos', async (req, res, next) => {
    try {
        const { segredo } = req.body;
        if (!segredo || segredo.trim() === '') throw new Error('O segredo não pode ser vazio.');

        const novoSegredo = await prisma.secret.create({
            data: {
                texto: segredo,
                authorId: req.usuario.id,
            },
        });
        res.status(201).json(novoSegredo);
    } catch (error) {
        next(error);
    }
});

app.put('/segredos/:id', async (req, res, next) => {
    try {
        const idParaEditar = parseInt(req.params.id);
        const { segredo } = req.body;

        const resultado = await prisma.secret.updateMany({
            where: {
                id: idParaEditar,
                authorId: req.usuario.id, // Garante que o usuário só pode editar seu próprio segredo
            },
            data: {
                texto: segredo,
            },
        });

        if (resultado.count === 0) throw new Error('Segredo não encontrado ou você não tem permissão.');

        res.status(200).send({ mensagem: 'Segredo atualizado com sucesso!' });
    } catch (error) {
        next(error);
    }
});

app.delete('/segredos/:id', async (req, res, next) => {
    try {
        const idParaApagar = parseInt(req.params.id);

        const resultado = await prisma.secret.deleteMany({
            where: {
                id: idParaApagar,
                authorId: req.usuario.id,
            },
        });

        if (resultado.count === 0) throw new Error('Segredo não encontrado ou você não tem permissão.');

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// ... (Sua Central de Erros continua aqui no final, sem alterações) ...
app.use((error, req, res, next) => {/*...*/});

module.exports = app;