// cleanup.js
const dbPromise = require('./database.js');

async function limparUsuariosInvalidos() {
    console.log('Iniciando limpeza de usuários com email inválido...');
    const db = await dbPromise;

    // Comando SQL para deletar entradas onde o campo email NÃO se parece com um email
    // A condição é: deletar se NÃO contiver um '@' OU se NÃO contiver um '.'
    const resultado = await db.run("DELETE FROM usuarios WHERE email NOT LIKE '%@%' OR email NOT LIKE '%.%'");

    if (resultado.changes > 0) {
        console.log(`SUCESSO: ${resultado.changes} usuário(s) inválido(s) foram removidos.`);
    } else {
        console.log('Nenhum usuário inválido encontrado para remover.');
    }
    // No mundo real, você não precisaria fechar a conexão, mas para um script único, é uma boa prática.
    // No nosso caso, como o dbPromise é compartilhado, não vamos fechá-lo aqui para não afetar outros processos.
}

limparUsuariosInvalidos().catch(console.error);