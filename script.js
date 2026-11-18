
// ========================================
// PINK PARTY - SISTEMA DE CONFRATERNIZAÇÃO
// ========================================

// BANCO DE DADOS LOCAL

const banco = {
    convidados: "pink_convidados",
    financeiro: "pink_financeiro",
    tarefas: "pink_tarefas",
    itens: "pink_itens",
    evento: "pink_evento"
};

function carregar(chave) {
    try {
        return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
        return [];
    }
}

function salvar(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarEvento() {
    try {
        return JSON.parse(localStorage.getItem(banco.evento)) || {};
    } catch {
        return {};
    }
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    if (!data) return "A definir";

    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ========================================
// CONVIDADOS
// ========================================

const formConvidado = document.getElementById("formConvidado");

if (formConvidado) {
    formConvidado.addEventListener("submit", function(event) {
        event.preventDefault();

        const convidados = carregar(banco.convidados);

        convidados.push({
            id: gerarId(),
            nome: document.getElementById("nomeConvidado").value.trim(),
            turma: document.getElementById("turmaConvidado").value.trim(),
            contato: document.getElementById("contatoConvidado").value.trim(),
            presenca: document.getElementById("presencaConvidado").value
        });

        salvar(banco.convidados, convidados);

        formConvidado.reset();
        renderizarConvidados();
        atualizarDashboard();

        alert("Convidado cadastrado com sucesso! 💗");
    });
}

function renderizarConvidados() {
    const tabela = document.getElementById("listaConvidados");
    if (!tabela) return;

    const convidados = carregar(banco.convidados);

    document.getElementById("quantidadeConvidados").textContent =
        `${convidados.length} pessoas`;

    if (convidados.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5">Nenhum convidado cadastrado.</td></tr>';
        return;
    }

    tabela.innerHTML = convidados.map(pessoa => `
        <tr>
            <td>${escapar(pessoa.nome)}</td>
            <td>${escapar(pessoa.turma || "-")}</td>
            <td>${escapar(pessoa.contato || "-")}</td>
            <td><span class="status">${escapar(pessoa.presenca)}</span></td>
            <td>
                <button class="btn-delete" data-action="remover-convidado"
                    data-id="${escapar(pessoa.id)}">Excluir</button>
            </td>
        </tr>
    `).join("");
}

// ========================================
// FINANCEIRO
// ========================================

const formFinanceiro = document.getElementById("formFinanceiro");

if (formFinanceiro) {
    formFinanceiro.addEventListener("submit", function(event) {
        event.preventDefault();

        const valor = Number(document.getElementById("valorFinanceiro").value);

        if (!Number.isFinite(valor) || valor <= 0) {
            alert("Digite um valor válido!");
            return;
        }

        const lancamentos = carregar(banco.financeiro);

        lancamentos.push({
            id: gerarId(),
            descricao: document.getElementById("descricaoFinanceiro").value.trim(),
            valor: valor,
            tipo: document.getElementById("tipoFinanceiro").value,
            data: document.getElementById("dataFinanceiro").value
        });

        salvar(banco.financeiro, lancamentos);

        formFinanceiro.reset();

        document.getElementById("dataFinanceiro").value =
            new Date().toLocaleDateString("en-CA");

        renderizarFinanceiro();
        atualizarDashboard();

        alert("Lançamento registrado! 💰");
    });
}

function renderizarFinanceiro() {
    const tabela = document.getElementById("listaFinanceiro");
    if (!tabela) return;

    const lancamentos = carregar(banco.financeiro);

    const entradas = lancamentos
        .filter(item => item.tipo === "Entrada")
        .reduce((total, item) => total + Number(item.valor), 0);

    const despesas = lancamentos
        .filter(item => item.tipo === "Despesa")
        .reduce((total, item) => total + Number(item.valor), 0);

    document.getElementById("arrecadado").textContent = moeda(entradas);
    document.getElementById("despesas").textContent = moeda(despesas);
    document.getElementById("saldo").textContent = moeda(entradas - despesas);
    document.getElementById("registros").textContent = lancamentos.length;

    if (lancamentos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5">Nenhum lançamento cadastrado.</td></tr>';
        return;
    }

    tabela.innerHTML = lancamentos.map(item => `
        <tr>
            <td>${escapar(item.descricao)}</td>
            <td><span class="status">${escapar(item.tipo)}</span></td>
            <td>${moeda(item.valor)}</td>
            <td>${formatarData(item.data)}</td>
            <td>
                <button class="btn-delete" data-action="remover-financeiro"
                    data-id="${escapar(item.id)}">Excluir</button>
            </td>
        </tr>
    `).join("");
}

// ========================================
// EVENTO
// ========================================

const formEvento = document.getElementById("formEvento");

if (formEvento) {
    const eventoSalvo = carregarEvento();

    document.getElementById("nomeEvento").value = eventoSalvo.nome || "";
    document.getElementById("dataEvento").value = eventoSalvo.data || "";
    document.getElementById("horarioEvento").value = eventoSalvo.horario || "";
    document.getElementById("localEvento").value = eventoSalvo.local || "";
    document.getElementById("descricaoEvento").value = eventoSalvo.descricao || "";

    formEvento.addEventListener("submit", function(event) {
        event.preventDefault();

        const dados = {
            nome: document.getElementById("nomeEvento").value.trim(),
            data: document.getElementById("dataEvento").value,
            horario: document.getElementById("horarioEvento").value,
            local: document.getElementById("localEvento").value.trim(),
            descricao: document.getElementById("descricaoEvento").value.trim()
        };

        localStorage.setItem(banco.evento, JSON.stringify(dados));

        atualizarDashboard();

        alert("Informações do evento salvas! 🌷");
    });
}

// ========================================
// TAREFAS
// ========================================

const formTarefa = document.getElementById("formTarefa");

if (formTarefa) {
    formTarefa.addEventListener("submit", function(event) {
        event.preventDefault();

        const tarefas = carregar(banco.tarefas);

        tarefas.push({
            id: gerarId(),
            nome: document.getElementById("nomeTarefa").value.trim(),
            responsavel: document.getElementById("responsavelTarefa").value.trim(),
            concluida: false
        });

        salvar(banco.tarefas, tarefas);

        formTarefa.reset();
        renderizarTarefas();
        atualizarDashboard();
    });
}

function renderizarTarefas() {
    const lista = document.getElementById("listaTarefas");
    if (!lista) return;

    const tarefas = carregar(banco.tarefas);

    if (tarefas.length === 0) {
        lista.innerHTML = '<p class="empty">Nenhuma tarefa cadastrada.</p>';
        return;
    }

    lista.innerHTML = tarefas.map(tarefa => `
        <div class="task-preview" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <label style="display:flex; align-items:center; gap:8px; flex:1;">
                <input type="checkbox" data-action="concluir-tarefa"
                    data-id="${escapar(tarefa.id)}"
                    ${tarefa.concluida ? "checked" : ""}>
                <span style="${tarefa.concluida ? "text-decoration:line-through; opacity:.6;" : ""}">
                    ${escapar(tarefa.nome)}
                    <br><small>Responsável: ${escapar(tarefa.responsavel || "Não definido")}</small>
                </span>
            </label>
            <button class="btn-delete" data-action="remover-tarefa"
                data-id="${escapar(tarefa.id)}">Excluir</button>
        </div>
    `).join("");
}

// ========================================
// COMIDAS E BEBIDAS
// ========================================

const formItem = document.getElementById("formItem");

if (formItem) {
    formItem.addEventListener("submit", function(event) {
        event.preventDefault();

        const itens = carregar(banco.itens);

        itens.push({
            id: gerarId(),
            nome: document.getElementById("nomeItem").value.trim(),
            categoria: document.getElementById("categoriaItem").value,
            responsavel: document.getElementById("responsavelItem").value.trim()
        });

        salvar(banco.itens, itens);

        formItem.reset();
        renderizarItens();

        alert("Item adicionado à organização! 🍰");
    });
}

function renderizarItens() {
    const lista = document.getElementById("listaItens");
    if (!lista) return;

    const itens = carregar(banco.itens);

    if (itens.length === 0) {
        lista.innerHTML = '<p class="empty">Nenhum item cadastrado.</p>';
        return;
    }

    lista.innerHTML = `
        <div class="table-container" style="padding:0; box-shadow:none;">
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Categoria</th>
                        <th>Responsável</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${itens.map(item => `
                        <tr>
                            <td>${escapar(item.nome)}</td>
                            <td>${escapar(item.categoria)}</td>
                            <td>${escapar(item.responsavel || "-")}</td>
                            <td>
                                <button class="btn-delete" data-action="remover-item"
                                    data-id="${escapar(item.id)}">Excluir</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// ========================================
// AÇÕES DE EXCLUSÃO E CONCLUSÃO
// ========================================

document.addEventListener("click", function(event) {
    const botao = event.target.closest("button[data-action]");
    if (!botao) return;

    const id = botao.dataset.id;
    const acao = botao.dataset.action;

    const configuracoes = {
        "remover-convidado": banco.convidados,
        "remover-financeiro": banco.financeiro,
        "remover-tarefa": banco.tarefas,
        "remover-item": banco.itens
    };

    if (configuracoes[acao]) {
        if (!confirm("Deseja realmente excluir este registro?")) return;

        const atualizados = carregar(configuracoes[acao])
            .filter(item => item.id !== id);

        salvar(configuracoes[acao], atualizados);

        renderizarConvidados();
        renderizarFinanceiro();
        renderizarTarefas();
        renderizarItens();
        atualizarDashboard();
    }
});

document.addEventListener("change", function(event) {
    const checkbox = event.target;

    if (checkbox.dataset.action !== "concluir-tarefa") return;

    const tarefas = carregar(banco.tarefas);

    const tarefa = tarefas.find(item => item.id === checkbox.dataset.id);

    if (tarefa) {
        tarefa.concluida = checkbox.checked;
        salvar(banco.tarefas, tarefas);
        renderizarTarefas();
        atualizarDashboard();
    }
});

// ========================================
// DASHBOARD
// ========================================

function atualizarDashboard() {
    const convidados = carregar(banco.convidados);
    const lancamentos = carregar(banco.financeiro);
    const tarefas = carregar(banco.tarefas);

    const totalConvidados = document.getElementById("totalConvidados");
    if (!totalConvidados) return;

    const confirmados = convidados.filter(
        pessoa => pessoa.presenca === "Confirmado"
    ).length;

    const arrecadado = lancamentos
        .filter(item => item.tipo === "Entrada")
        .reduce((total, item) => total + Number(item.valor), 0);

    const concluidas = tarefas.filter(
        tarefa => tarefa.concluida
    ).length;

    totalConvidados.textContent = convidados.length;
    document.getElementById("totalConfirmados").textContent = confirmados;
    document.getElementById("totalArrecadado").textContent = moeda(arrecadado);
    document.getElementById("totalTarefas").textContent =
        `${concluidas}/${tarefas.length}`;

    const evento = carregarEvento();

    document.getElementById("eventoNome").textContent =
        evento.nome || "Minha Confraternização";

    document.getElementById("eventoData").textContent =
        formatarData(evento.data);

    document.getElementById("eventoHorario").textContent =
        evento.horario || "A definir";

    document.getElementById("eventoLocal").textContent =
        evento.local || "A definir";

    const resumo = document.getElementById("tarefasResumo");

    if (resumo) {
        const pendentes = tarefas.filter(tarefa => !tarefa.concluida);

        resumo.innerHTML = pendentes.length
            ? pendentes.slice(0, 4).map(tarefa => `
                <div class="task-preview">
                    📝 ${escapar(tarefa.nome)}
                    <br><small>Responsável: ${escapar(tarefa.responsavel || "Não definido")}</small>
                </div>
            `).join("")
            : '<p class="empty">Tudo em dia! 💗</p>';
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    renderizarConvidados();
    renderizarFinanceiro();
    renderizarTarefas();
    renderizarItens();
    atualizarDashboard();

    const campoData = document.getElementById("dataFinanceiro");

    if (campoData && !campoData.value) {
        campoData.value = new Date().toLocaleDateString("en-CA");
    }
});
