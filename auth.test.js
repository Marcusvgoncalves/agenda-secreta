const request = require('supertest');
const app = require('./app.js'); // Importamos nosso app, e não o index.js!

// Descrevemos o conjunto de testes para as rotas de autenticação
describe('Testes das Rotas de Autenticação', () => {

    // O 'it' descreve um caso de teste específico
    it('Deve registrar um novo usuário com sucesso', async () => {
        const novoUsuario = {
            email: `teste-${Date.now()}@exemplo.com`, // Email único para cada teste
            senha: 'senha123'
        };

        // Usamos o supertest para fazer a requisição POST
        const response = await request(app)
            .post('/auth/register')
            .send(novoUsuario);

        // Usamos o 'expect' do Jest para verificar a resposta
        expect(response.statusCode).toBe(201); // Esperamos um status 201 Created
        expect(response.body).toHaveProperty('mensagem', 'Usuário criado com sucesso!'); // Esperamos a mensagem correta
    });

    it('Não deve registrar um usuário com email já existente', async () => {
        const usuarioExistente = {
            email: 'usuario-existente@exemplo.com',
            senha: 'senha123'
        };

        // Primeiro, criamos o usuário
        await request(app).post('/auth/register').send(usuarioExistente);

        // Depois, tentamos criá-lo novamente
        const response = await request(app)
            .post('/auth/register')
            .send(usuarioExistente);

        expect(response.statusCode).toBe(409); // Esperamos um status 409 Conflict
        expect(response.body).toHaveProperty('mensagem', 'Este email já está em uso.');
    });

});