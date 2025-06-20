const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 1. Importar a nova biblioteca
const { abrirBancoDeDados } = require('./database.js');

const router = express.Router();

// Rota de Cadastro: POST /auth/register
router.post('/register', async (req, res) => {
    // ... (seu código de cadastro continua aqui, sem alterações)
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).send({ mensagem: 'Email e senha são obrigatórios.' });
    }
    try {
        const db = await abrirBancoDeDados();
        const senhaHash = await bcrypt.hash(senha, 10);
        await db.run('INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)', [email, senhaHash]);
        await db.close();
        res.status(201).send({ mensagem: 'Usuário criado com sucesso!' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).send({ mensagem: 'Este email já está em uso.' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).send({ mensagem: 'Erro ao registrar usuário.' });
    }
});

// ROTA NOVA: Login de Usuário - POST /auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send({ mensagem: 'Email e senha são obrigatórios.' });
    }

    const db = await abrirBancoDeDados();

    // 1. Encontrar o usuário pelo email no banco de dados
    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);

    // Se o usuário não existe, retornamos um erro genérico por segurança
    if (!usuario) {
        await db.close();
        return res.status(401).send({ mensagem: 'Credenciais inválidas.' });
    }

    // 2. Comparar a senha enviada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
        await db.close();
        return res.status(401).send({ mensagem: 'Credenciais inválidas.' });
    }

    // 3. Se a senha é válida, GERAR O TOKEN (o crachá)
    const payload = { id: usuario.id, email: usuario.email }; // O que vai dentro do crachá
    const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, // Nossa "caneta" com tinta secreta
        { expiresIn: '1h' } // Data de validade do crachá: 1 hora
    );

    await db.close();
    res.status(200).json({ token: token }); // Envia o token para o cliente
});

module.exports = router;