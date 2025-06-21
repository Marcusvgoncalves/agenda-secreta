// authRoutes.js REFATORADO

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const dbPromise = require('./database.js');
const logger = require('./logger.js');

const router = express.Router();

const schemaCadastro = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
  senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
});

// Rota de Cadastro com 'catch' simplificado
router.post('/register', async (req, res, next) => { 
    try {
        const { email, senha } = schemaCadastro.parse(req.body);
        const db = await dbPromise;
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.run('INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)', [email, senhaHash]);
        res.status(201).send({ mensagem: 'Usuário criado com sucesso!' });
    } catch (error) {
        // Apenas passamos o erro para a central com o 'next'
        next(error); 
    }
});

// Rota de Login com 'catch' simplificado
router.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            // Podemos criar um erro customizado para a central pegar
            const error = new Error('Email e senha são obrigatórios.');
            error.status = 400; // status customizado
            throw error;
        }
        
        const db = await dbPromise;
        const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (!usuario) {
            const error = new Error('Credenciais inválidas.');
            error.status = 401;
            throw error;
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            const error = new Error('Credenciais inválidas.');
            error.status = 401;
            throw error;
        }

        const payload = { id: usuario.id, email: usuario.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ token: token });
    } catch (error) {
        next(error); // Passamos qualquer erro para a central
    }
});

module.exports = router;