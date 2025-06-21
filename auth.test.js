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

<<<<<<< HEAD
    // --- ADICIONE OS NOVOS TESTES DE LOGIN AQUI ---

    it('Deve autenticar um usuário existente e retornar um token JWT', async () => {
        const usuario = {
            email: `loginteste-${Date.now()}@exemplo.com`,
            senha: 'senha123'
        };

        // Primeiro, precisamos garantir que o usuário existe no banco
        await request(app).post('/auth/register').send(usuario);

        // Agora, tentamos fazer o login com as credenciais corretas
        const response = await request(app)
            .post('/auth/login')
            .send(usuario);

        expect(response.statusCode).toBe(200); // Esperamos um status 200 OK
        expect(response.body).toHaveProperty('token'); // Esperamos que a resposta tenha a propriedade "token"
    });

    it('Não deve autenticar um usuário com senha incorreta', async () => {
        const usuario = {
            email: `loginsenhaerrada-${Date.now()}@exemplo.com`,
            senha: 'senha123'
        };

        // Criamos o usuário
        await request(app).post('/auth/register').send(usuario);

        // Tentamos fazer login com a senha errada
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: usuario.email,
                senha: 'senha-errada'
            });

        expect(response.statusCode).toBe(401); // Esperamos um status 401 Unauthorized
        expect(response.body).toHaveProperty('mensagem', 'Credenciais inválidas.');
    });

=======
>>>>>>> 764da9965afec9b10ab45d0d29c310baa3556a87
});