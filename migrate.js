// migrate.js
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const logger = require('./logger.js'); // Vamos usar nosso logger para registrar o processo!

async function runMigrations() {
    let db;
    try {
        // Abre o banco de dados
        db = await open({
            filename: './agenda.db',
            driver: sqlite3.Database
        });

        logger.info('Iniciando a execução das migrations...');

        // O comando mágico: db.migrate() encontra e executa os arquivos .sql
        // na pasta 'migrations' que ainda não foram aplicados.
        await db.migrate({
            // force: 'last' // Opcional: útil em desenvolvimento para forçar a última migration a rodar de novo.
        });

        logger.info('Migrações concluídas com sucesso.');

    } catch (err) {
        logger.error('Falha ao executar as migrations:', err);
        process.exit(1); // Sai do processo com um código de erro se algo falhar
    } finally {
        // Garante que a conexão com o banco de dados seja sempre fechada ao final.
        if (db) {
            await db.close();
        }
    }
}

// Executa a função principal
runMigrations();