// ======================================================
//     VERSÃO COM GERENCIAMENTO DE ESTADO - SCRIPT.JS
// ======================================================

// --- SELETORES DE ELEMENTOS ---
const telaLogin = document.getElementById('tela-login');
const telaPrincipal = document.getElementById('tela-principal');
const formLogin = document.getElementById('form-login');
const inputEmailLogin = document.getElementById('input-email');
const inputSenhaLogin = document.getElementById('input-senha');
const mensagemLogin = document.getElementById('mensagem-login');
const botaoLogout = document.getElementById('botao-logout');
const formNovoSegredo = document.getElementById('form-novo-segredo');
const inputSegredo = document.getElementById('input-segredo');
const listaSegredos = document.getElementById('lista-segredos');

// --- VARIÁVEIS GLOBAIS ---
const authUrl = 'http://localhost:3000/auth';
const segredosUrl = 'http://localhost:3000/segredos';
let estadoDosSegredos = []; // <<<--- NOSSA CÓPIA LOCAL (O "ESTADO")

// --- FUNÇÕES DE RENDERIZAÇÃO ---

/**
 * Nova função! Sua única responsabilidade é "desenhar" a lista na tela
 * com base no que está na variável 'estadoDosSegredos'.
 */
function renderizarSegredos() {
    listaSegredos.innerHTML = ''; // Limpa a lista antiga
    if (estadoDosSegredos.length === 0) {
        listaSegredos.innerHTML = '<li>Nenhum segredo guardado ainda.</li>';
        return;
    }
    estadoDosSegredos.forEach(segredo => {
        const itemLista = document.createElement('li');
        itemLista.className = 'item-segredo';
        const textoSegredo = document.createElement('span');
        textoSegredo.textContent = segredo.texto;
        const divBotoes = document.createElement('div');
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.className = 'botao-editar';
        botaoEditar.addEventListener('click', () => editarSegredo(segredo.id, segredo.texto));
        const botaoDeletar = document.createElement('button');
        botaoDeletar.textContent = 'Deletar';
        botaoDeletar.addEventListener('click', () => deletarSegredo(segredo.id));
        divBotoes.appendChild(botaoEditar);
        divBotoes.appendChild(botaoDeletar);
        itemLista.appendChild(textoSegredo);
        itemLista.appendChild(divBotoes);
        listaSegredos.appendChild(itemLista);
    });
}


// --- FUNÇÕES DE CONTROLE DE TELA ---
// (mostrarTelaLogin e mostrarTelaPrincipal continuam iguais)
function mostrarTelaLogin() { /* ... */ }
async function mostrarTelaPrincipal() { /* ... */ }

// --- FUNÇÕES DE EVENTOS ---
// (handleLogin e handleLogout continuam iguais)
async function handleLogin(event) { /* ... */ }
function handleLogout() { /* ... */ }

async function handleAddSegredo(event) {
    event.preventDefault();
    const texto = inputSegredo.value;
    if (!texto) return;
    await adicionarSegredo(texto); // Chama a função da API
    inputSegredo.value = ''; // Limpa o input
}


// --- FUNÇÕES DE INTERAÇÃO COM A API (AGORA MODIFICADAS) ---

async function buscarEExibirSegredos() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
        const response = await fetch(segredosUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar segredos.');
        const segredos = await response.json();

        // ATUALIZAÇÃO: Em vez de desenhar, agora só atualiza o estado
        estadoDosSegredos = segredos;
        // E chama a função de renderização
        renderizarSegredos();
    } catch (error) {
        console.error('Erro ao buscar segredos:', error);
    }
}

async function adicionarSegredo(texto) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(segredosUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ segredo: texto })
        });
        if (!response.ok) throw new Error('Falha ao adicionar segredo.');
        const novoSegredo = await response.json(); // A API nos retorna o segredo criado

        // ATUALIZAÇÃO: Manipulamos o estado local em vez de recarregar tudo
        estadoDosSegredos.push({ id: novoSegredo.id, texto: texto });
        renderizarSegredos();
    } catch (error) {
        console.error('Erro ao adicionar segredo:', error);
        alert('Não foi possível adicionar o segredo.');
    }
}

async function editarSegredo(id, textoAtual) {
    const token = localStorage.getItem('jwtToken');
    const novoTexto = prompt('Edite seu segredo:', textoAtual);
    if (novoTexto === null || novoTexto.trim() === '') return;
    try {
        const response = await fetch(`<span class="math-inline">\{segredosUrl\}/</span>{id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ segredo: novoTexto })
        });
        if (!response.ok) throw new Error('Falha ao editar segredo.');

        // ATUALIZAÇÃO: Manipulamos o estado local
        const indexDoSegredo = estadoDosSegredos.findIndex(s => s.id === id);
        if (indexDoSegredo !== -1) {
            estadoDosSegredos[indexDoSegredo].texto = novoTexto;
        }
        renderizarSegredos();
    } catch (error) {
        console.error('Erro ao editar segredo:', error);
        alert('Não foi possível editar o segredo.');
    }
}

async function deletarSegredo(id) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`<span class="math-inline">\{segredosUrl\}/</span>{id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao deletar segredo.');

        // ATUALIZAÇÃO: Manipulamos o estado local
        estadoDosSegredos = estadoDosSegredos.filter(s => s.id !== id);
        renderizarSegredos();
    } catch (error) {
        console.error('Erro ao deletar segredo:', error);
        alert('Não foi possível deletar o segredo.');
    }
}

// --- PONTO DE ENTRADA DA APLICAÇÃO ---
// (init e os addEventListener continuam iguais)
function init() { /* ... */ }
formLogin.addEventListener('submit', handleLogin);
botaoLogout.addEventListener('click', handleLogout);
formNovoSegredo.addEventListener('submit', handleAddSegredo);

init();