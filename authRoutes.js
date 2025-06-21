// authRoutes.js REFATORADO COM PRISMA

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma.js'); // Importamos nossa instância do Prisma
const logger = require('./logger.js');

const router = express.Router();

const schemaCadastro = z.object({
    email: z.string().email({ message: "Formato de email inválido." }),
    senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
});

// Rota de Cadastro com Prisma
router.post('/register', async (req, res, next) => {
    try {
        const { email, senha } = schemaCadastro.parse(req.body);
        const senhaHash = await bcrypt.hash(senha, 10);

        // Usando o Prisma para criar um novo usuário
        await prisma.user.create({
            data: {
                email: email,
                senha_hash: senhaHash,
            },
        });

        res.status(201).send({ mensagem: 'Usuário criado com sucesso!' });
    } catch (error) {
        // O Prisma lança um erro com código P2002 para violações de constraint unique
        if (error?.code === 'P2002') {
            logger.warn(`Tentativa de registro com email duplicado: ${req.body.email}`);
            // Criamos um erro customizado para nossa central de erros
            const err = new Error('Este email já está em uso.');
            err.status = 409;
            return next(err);
        }
        next(error); 
    }
});

// Rota de Login com Prisma
router.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) throw new Error('Email e senha são obrigatórios.');

        // Usando o Prisma para encontrar um usuário pelo email
        const usuario = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!usuario) throw new Error('Credenciais inválidas.');

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) throw new Error('Credenciais inválidas.');

        const payload = { id: usuario.id, email: usuario.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token: token });
    } catch (error) {
        error.status = 401; // Adiciona o status de não autorizado para o erro de login
        next(error);
    }
});

module.exports = router;