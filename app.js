require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // <-- 1. IMPORTAR A BIBLIOTECA JWT
const { abrirBancoDeDados } = require('./database.js');
const authRoutes = require('./authRoutes.js');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); // 1. IMPORTAR O PACOTE

const app = express();
const port = 3000;

// A CHAVE_SECRETA_API não é mais necessária, pode ser removida.
// const CHAVE_SECRETA_API = process.env.API_KEY;

const CHAVE_SECRETA_API = process.env.API_KEY;
// ADICIONE ESTA LINHA PARA DEBUGAR:
console.log('Chave secreta carregada pelo servidor:', CHAVE_SECRETA_API);

// 2. REESCREVER COMPLETAMENTE O MIDDLEWARE DE AUTENTICAÇÃO
const autenticar = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do "Bearer <token>"

    if (token == null) {
        return res.status(401).send({ mensagem: 'Token não fornecido.' }); // Não autorizado
    }

    // Tenta verificar o token
    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            return res.status(403).send({ mensagem: 'Token inválido ou expirado.' }); // Proibido
        }

        // IMPORTANTE: Se o token é válido, nós "anexamos" os dados do usuário
        // na própria requisição, para que as rotas seguintes saibam quem fez o pedido.
        req.usuario = usuario; 

        next(); // O usuário é válido, pode prosseguir para a próxima rota.
    });
};

// 2. CRIAR E CONFIGURAR O NOSSO LIMITADOR
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // Janela de tempo: 15 minutos em milissegundos
	max: 5, // Limita cada IP a 5 requisições dentro da janela de tempo
	message: { mensagem: 'Muitas tentativas de login a partir deste IP, por favor, tente novamente após 15 minutos.' },
	standardHeaders: true, // Padrão recomendado
	legacyHeaders: false, // Desabilita cabeçalhos antigos
});

app.use(express.json());
app.use(cors());
app.use(helmet()); // <-- ADICIONE ESTA LINHA AQUI

// --- ROTAS ---
// 3. APLICAR O LIMITADOR ÀS ROTAS DE AUTENTICAÇÃO
app.use('/auth', loginLimiter, authRoutes); // Colocamos o 'loginLimiter' ANTES de 'authRoutes'
app.use('/segredos', autenticar);

// --- ROTAS DE SEGREDOS ATUALIZADAS ---

// READ (GET) - Lista apenas os segredos DO usuário logado
app.get('/segredos', async (req, res) => {
    const usuarioId = req.usuario.id; // Pegamos o ID do usuário a partir do token!
    const db = await abrirBancoDeDados();
    const segredos = await db.all('SELECT * FROM segredos WHERE usuario_id = ?', [usuarioId]);
    await db.close();
    res.json(segredos);
});

// CREATE (POST) - Cria um segredo VINCULADO ao usuário logado
app.post('/segredos', async (req, res) => {
    const textoDoSegredo = req.body.segredo;
    const usuarioId = req.usuario.id; // Pegamos o ID do usuário
    if (!textoDoSegredo || textoDoSegredo.trim() === "") {
        return res.status(400).send({ mensagem: 'O segredo não pode ser vazio.' });
    }

    const db = await abrirBancoDeDados();
    const resultado = await db.run('INSERT INTO segredos (texto, usuario_id) VALUES (?, ?)', [textoDoSegredo, usuarioId]);
    await db.close();
    
    res.status(201).send({
        mensagem: 'Segredo adicionado com sucesso!',
        id: resultado.lastID
    });
});

// UPDATE (PUT) - Atualiza um segredo, SE E SOMENTE SE, pertencer ao usuário logado
app.put('/segredos/:id', async (req, res) => {
    const idParaEditar = parseInt(req.params.id);
    const novoTexto = req.body.segredo;
    const usuarioId = req.usuario.id;
    // ... (validação do novoTexto) ...

    const db = await abrirBancoDeDados();
    // A cláusula WHERE agora tem DUAS condições para máxima segurança
    const resultado = await db.run('UPDATE segredos SET texto = ? WHERE id = ? AND usuario_id = ?', [novoTexto, idParaEditar, usuarioId]);
    await db.close();

    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado ou você não tem permissão para editá-lo.' });
    }

    res.status(200).send({ mensagem: 'Segredo atualizado com sucesso!' });
});

// DELETE - Deleta um segredo, SE E SOMENTE SE, pertencer ao usuário logado
app.delete('/segredos/:id', async (req, res) => {
    const idParaApagar = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    const db = await abrirBancoDeDados();
    const resultado = await db.run('DELETE FROM segredos WHERE id = ? AND usuario_id = ?', [idParaApagar, usuarioId]);
    await db.close();

    if (resultado.changes === 0) {
        return res.status(404).send({ mensagem: 'Segredo não encontrado ou você não tem permissão para deletá-lo.' });
    }

    res.status(204).send();
});

module.exports = app; // <-- A LINHA MAIS IMPORTANTE