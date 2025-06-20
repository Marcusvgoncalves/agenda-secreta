const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function abrirBancoDeDados() {
  return open({
    filename: './agenda.db',
    driver: sqlite3.Database
  });
}

async function configurarBancoDeDados() {
    const db = await abrirBancoDeDados();

    // 1. Comando para criar a tabela de segredos (já existia)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS segredos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. ADIÇÃO: Comando para criar a nova tabela de usuários
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL
        )
    `);

    await db.close();
    console.log("Banco de dados configurado com sucesso.");
}

module.exports = { abrirBancoDeDados, configurarBancoDeDados };