// ======================================================
//        VERSÃO FINAL E CORRIGIDA - SCRIPT.JS
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

// --- ENDPOINTS DA API ---
const authUrl = 'http://localhost:3000/auth';
const segredosUrl = 'http://localhost:3000/segredos';

// --- FUNÇÕES DE CONTROLE DE TELA ---

function mostrarTelaLogin() {
    telaLogin.classList.remove('hidden');
    telaPrincipal.classList.add('hidden');
}

async function mostrarTelaPrincipal() {
    telaLogin.classList.add('hidden');
    telaPrincipal.classList.remove('hidden');
    await buscarEExibirSegredos();
}

// --- FUNÇÕES DE EVENTOS ---

async function handleLogin(event) {
    event.preventDefault();
    mensagemLogin.textContent = '';
    const email = inputEmailLogin.value;
    const senha = inputSenhaLogin.value;
    try {
        const response = await fetch(`${authUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Credenciais inválidas.');
        }
        localStorage.setItem('jwtToken', data.token);
        init();
    } catch (error) {
        mensagemLogin.textContent = error.message;
    }
}

function handleLogout() {
    localStorage.removeItem('jwtToken');
    init();
}

async function handleAddSegredo(event) {
    event.preventDefault();
    const texto = inputSegredo.value;
    if (!texto) return;
    await adicionarSegredo(texto);
    inputSegredo.value = '';
}

// --- FUNÇÕES DE INTERAÇÃO COM A API ---

async function buscarEExibirSegredos() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    listaSegredos.innerHTML = '<li>Carregando...</li>';
    try {
        const response = await fetch(segredosUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar segredos.');
        const segredos = await response.json();
        listaSegredos.innerHTML = '';
        if (segredos.length === 0) {
            listaSegredos.innerHTML = '<li>Nenhum segredo guardado ainda.</li>';
            return;
        }
        segredos.forEach(segredo => {
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
    } catch (error) {
        console.error('Erro ao buscar segredos:', error);
        listaSegredos.innerHTML = '<li>Erro ao carregar segredos.</li>';
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
        await buscarEExibirSegredos();
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
        const response = await fetch(`${segredosUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ segredo: novoTexto })
        });
        if (!response.ok) throw new Error('Falha ao editar segredo.');
        await buscarEExibirSegredos();
    } catch (error) {
        console.error('Erro ao editar segredo:', error);
        alert('Não foi possível editar o segredo.');
    }
}

async function deletarSegredo(id) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${segredosUrl}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao deletar segredo.');
        await buscarEExibirSegredos();
    } catch (error) {
        console.error('Erro ao deletar segredo:', error);
        alert('Não foi possível deletar o segredo.');
    }
}

// --- PONTO DE ENTRADA DA APLICAÇÃO ---
function init() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        mostrarTelaPrincipal();
    } else {
        mostrarTelaLogin();
    }
    formLogin.addEventListener('submit', handleLogin);
    botaoLogout.addEventListener('click', handleLogout);
    formNovoSegredo.addEventListener('submit', handleAddSegredo);
}

init();