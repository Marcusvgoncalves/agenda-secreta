const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbPromise = require('./database.js');
const logger = require('./logger.js'); // <-- LINHA ADICIONADA

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).send({ mensagem: 'Email e senha são obrigatórios.' });
    }

    try {
        const db = await dbPromise;
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.run('INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)', [email, senhaHash]);
        res.status(201).send({ mensagem: 'Usuário criado com sucesso!' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).send({ mensagem: 'Este email já está em uso.' });
        }
        // A linha abaixo é a que faltava na minha instrução anterior
        logger.error('Erro ao registrar usuário:', error); // <-- LINHA ADICIONADA
        res.status(500).send({ mensagem: 'Erro ao registrar usuário.' });
    }
});

// O resto do seu código de login continua aqui...
router.post('/login', async (req, res) => {
    // ... seu código de login ...
});


module.exports = router;