require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <-- ADICIONE ESTA LINHA AQUI
const { abrirBancoDeDados } = require('./database.js'); // Importamos nossa função
const authRoutes = require('./authRoutes.js'); // <-- 1. IMPORTAR AS NOVAS ROTAS

const app = express();
const port = 3000;

const CHAVE_SECRETA_API = process.env.API_KEY;
// ADICIONE ESTA LINHA PARA DEBUGAR:
console.log('Chave secreta carregada pelo servidor:', CHAVE_SECRETA_API);

const autenticar = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== CHAVE_SECRETA_API) {
        return res.status(403).send('Acesso proibido.');
    }
    next();
};

app.use(express.json());
app.use(cors()); // <-- ADICIONE ESTA LINHA AQUI
// --- ROTAS ---
app.use('/auth', authRoutes); // <-- 2. USAR AS ROTAS DE AUTENTICAÇÃO
app.use('/segredos', autenticar);


// READ (GET) - Agora busca no banco de dados
app.get('/segredos', async (req, res) => {
    const db = await abrirBancoDeDados();
    const segredos = await db.all('SELECT * FROM segredos'); // SQL para selecionar tudo
    await db.close();
    res.json(segredos);
});

// CREATE (POST) - Agora insere no banco de dados
app.post('/segredos', async (req, res) => {
    const textoDoSegredo = req.body.segredo;
    if (!textoDoSegredo || textoDoSegredo.trim() === "") {
        return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
    }

    const db = await abrirBancoDeDados();
    // O '?' é um placeholder para evitar SQL Injection (MUITO IMPORTANTE!)
    const resultado = await db.run('INSERT INTO segredos (texto) VALUES (?)', [textoDoSegredo]);
    await db.close();
    
    res.status(201).send({
        mensagem: 'Segredo adicionado com sucesso!',
        id: resultado.lastID // O banco de dados nos dá o ID do item inserido
    });
});

// UPDATE (PUT) - Agora atualiza no banco de dados
app.put('/segredos/:id', async (req, res) => {
    const idParaEditar = parseInt(req.params.id);
    const novoTexto = req.body.segredo;
    if (!novoTexto || novoTexto.trim() === "") {
        return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
    }

    const db = await abrirBancoDeDados();
    const resultado = await db.run('UPDATE segredos SET texto = ? WHERE id = ?', [novoTexto, idParaEditar]);
    await db.close();

    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado.' });
    }

    res.status(200).send({ mensagem: 'Segredo atualizado com sucesso!' });
});

// DELETE - Agora apaga do banco de dados
app.delete('/segredos/:id', async (req, res) => {
    const idParaApagar = parseInt(req.params.id);
    const db = await abrirBancoDeDados();
    const resultado = await db.run('DELETE FROM segredos WHERE id = ?', [idParaApagar]);
    await db.close();

    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado.' });
    }

    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log("Banco de dados conectado e pronto.");
});