const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbPromise = require('./database.js');

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
        res.status(500).send({ mensagem: 'Erro ao registrar usuário.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).send({ mensagem: 'Email e senha são obrigatórios.' });
    }
    const db = await dbPromise;
    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!usuario) {
        return res.status(401).send({ mensagem: 'Credenciais inválidas.' });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
        return res.status(401).send({ mensagem: 'Credenciais inválidas.' });
    }
    const payload = { id: usuario.id, email: usuario.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token: token });
});

module.exports = router;