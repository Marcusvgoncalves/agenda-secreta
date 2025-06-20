const app = require('./app.js'); // Importa a aplicação do app.js
const port = 3000;

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});