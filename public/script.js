// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---

// URL da nossa API. Lembre-se que ela está rodando na porta 3000
const apiUrl = 'http://localhost:3000/segredos';
// A chave de API que o nosso backend espera.
// Lembre-se de usar a mesma chave que está no seu arquivo .env!
const apiKey = 'BatatinhaQuandoNasce123SuperSecreta'; 

// Selecionando os elementos do HTML com os quais vamos interagir
const listaSegredos = document.getElementById('lista-segredos');
const formNovoSegredo = document.getElementById('form-novo-segredo');
const inputSegredo = document.getElementById('input-segredo');

// --- FUNÇÕES ---

/**
 * Função principal: Busca todos os segredos na API e os exibe na tela.
 */
async function buscarEExibirSegredos() {
    // Limpa a lista atual para não duplicar itens ao recarregar
    listaSegredos.innerHTML = '';

    try {
        // Fazendo a requisição GET para a nossa API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey // Enviando nossa chave de API no cabeçalho
            }
        });

        // Se a resposta não for OK (ex: erro de autenticação), lança um erro
        if (!response.ok) {
            throw new Error('Falha ao buscar segredos. Verifique a chave de API.');
        }

        // Converte a resposta em JSON
        const segredos = await response.json();

        // Para cada segredo recebido, cria um item na lista (<li>)
        segredos.forEach(segredo => {
            const itemLista = document.createElement('li');
            itemLista.className = 'item-segredo'; // Adiciona a classe CSS que criamos

            const textoSegredo = document.createElement('span');
            textoSegredo.textContent = segredo.texto;

            const botaoDeletar = document.createElement('button');
            botaoDeletar.textContent = 'Deletar';
            // Adiciona um "ouvinte" que chama a função deletarSegredo quando o botão é clicado
            botaoDeletar.addEventListener('click', () => deletarSegredo(segredo.id));

            itemLista.appendChild(textoSegredo);
            itemLista.appendChild(botaoDeletar);
            listaSegredos.appendChild(itemLista);
        });

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar os segredos. Verifique o console para mais detalhes.');
    }
}

/**
 * Função para adicionar um novo segredo.
 */
async function adicionarSegredo(event) {
    // Previne o comportamento padrão do formulário, que é recarregar a página
    event.preventDefault(); 

    const texto = inputSegredo.value;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Informa que estamos enviando JSON
                'x-api-key': apiKey
            },
            // Converte nosso objeto JavaScript em uma string JSON para enviar
            body: JSON.stringify({ segredo: texto }) 
        });

        if (!response.ok) {
            throw new Error('Falha ao adicionar segredo.');
        }

        inputSegredo.value = ''; // Limpa o campo de texto após o envio
        buscarEExibirSegredos(); // Recarrega a lista para mostrar o novo segredo

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível adicionar o segredo.');
    }
}

/**
 * Função para deletar um segredo específico pelo seu ID.
 */
async function deletarSegredo(id) {
    try {
        // Note como o ID é adicionado à URL para especificar qual segredo deletar
const response = await fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
    headers: {
        'x-api-key': apiKey
    }
});

        if (!response.ok) {
            throw new Error('Falha ao deletar segredo.');
        }

        buscarEExibirSegredos(); // Recarrega a lista para mostrar que o item foi removido

    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível deletar o segredo.');
    }
}


// --- INICIALIZAÇÃO ---

// Adiciona o "ouvinte" ao formulário para chamar a função adicionarSegredo no evento 'submit'
formNovoSegredo.addEventListener('submit', adicionarSegredo);

// Chama a função principal para carregar os dados assim que a página é aberta
buscarEExibirSegredos();