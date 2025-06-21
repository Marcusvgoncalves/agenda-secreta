const app = require('./app.js'); // Importa a aplicação do app.js
const logger = require('./logger');
const port = 3000;

// Em index.js
app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
    logger.info("Banco de dados conectado e pronto.");
});