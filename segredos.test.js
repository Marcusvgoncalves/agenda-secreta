const request = require('supertest');
const app = require('./app.js');

describe('Testes das Rotas de Segredos (Protegidas)', () => {

    let token; // Variável para armazenar nosso token JWT
    let usuarioDeTeste; // Variável para guardar os dados do nosso usuário

    // O bloco beforeAll roda UMA VEZ antes de todos os testes deste arquivo
    beforeAll(async () => {
        // 1. Criamos um usuário único para este conjunto de testes
        usuarioDeTeste = {
            email: `usuariosegredos-${Date.now()}@exemplo.com`,
            senha: 'senha123'
        };
        await request(app).post('/auth/register').send(usuarioDeTeste);

        // 2. Fazemos login com esse usuário para obter um token
        const response = await request(app).post('/auth/login').send(usuarioDeTeste);
        
        // 3. Armazenamos o token na nossa variável para usar nos testes abaixo
        token = response.body.token; 
    });

    // --- Agora começam os testes das rotas protegidas ---

    it('Não deve permitir criar um segredo sem um token', async () => {
        const response = await request(app)
            .post('/segredos')
            .send({ segredo: 'Este segredo não deve ser criado' });
        
        expect(response.statusCode).toBe(401); // Esperamos "Não Autorizado"
    });

    it('Deve permitir que um usuário autenticado crie um novo segredo', async () => {
        const response = await request(app)
            .post('/segredos')
            .set('Authorization', `Bearer ${token}`) // <<-- A MÁGICA ACONTECE AQUI!
            .send({ segredo: 'Meu primeiro segredo secreto' });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('mensagem', 'Segredo adicionado com sucesso!');
    });

    it('Deve permitir que um usuário autenticado liste SEUS PRÓPRIOS segredos', async () => {
        // Primeiro, criamos um segredo para ter certeza de que há algo para listar
        await request(app)
            .post('/segredos')
            .set('Authorization', `Bearer ${token}`)
            .send({ segredo: 'Outro segredo para a lista' });

        // Agora, listamos os segredos
        const response = await request(app)
            .get('/segredos')
            .set('Authorization', `Bearer ${token}`); // <<-- USANDO O TOKEN NOVAMENTE

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // A resposta deve ser uma lista (array)
        expect(response.body.length).toBeGreaterThan(0); // A lista não deve estar vazia
        expect(response.body[0]).toHaveProperty('texto');
    });

});