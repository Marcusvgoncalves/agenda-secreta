const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Esta função vai abrir a conexão com o banco de dados
async function abrirBancoDeDados() {
  return open({
    filename: './agenda.db', // O nome do arquivo que será o nosso banco de dados
    driver: sqlite3.Database
  });
}

// Esta função vai configurar o banco de dados, criando a tabela se ela não existir
async function configurarBancoDeDados() {
    const db = await abrirBancoDeDados();

    // Executamos um comando SQL para criar a tabela "segredos"
    // IF NOT EXISTS garante que isso só aconteça uma vez.
    await db.exec(`
        CREATE TABLE IF NOT EXISTS segredos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // IMPORTANTE: Fechamos a conexão aqui, pois este script só serve para configurar.
    await db.close();
    console.log("Banco de dados configurado com sucesso.");
}

// Exportamos a função de abrir o banco para usá-la na nossa API.
// E também a de configurar, para podermos rodá-la separadamente.
module.exports = { abrirBancoDeDados, configurarBancoDeDados };