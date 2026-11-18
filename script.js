
/* ==========================================
   SAKURA PARTY
   Sistema de organização de confraternizações
   Armazenamento local com localStorage
========================================== */

const STORAGE_KEY = "sakuraPartyDatabase";

const emptyDatabase = {
    events: [],
    people: [],
    expenses: []
};

function loadDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(emptyDatabase);
        }

        const data = JSON.parse(saved);

        return {
            events: Array.isArray(data.events) ? data.events : [],
            people: Array.isArray(data.people) ? data.people : [],
            expenses: Array.isArray(data.expenses) ? data.expenses : []
        };
    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
        alert("Não foi possível carregar os dados salvos.");
        return structuredClone(emptyDatabase);
    }
}

let database = loadDatabase();

function saveDatabase() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
        return true;
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Não foi possível salvar. Verifique o espaço disponível no navegador.");
        return false;
    }
}

/* ==========================================
   FUNÇÕES GERAIS
========================================== */

function createId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getElement(id) {
    return document.getElementById(id);
}

function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(date) {
    if (!date) return "Sem data";

    const parts = date.split("-");

    if (parts.length !== 3) return "Data inválida";

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getEventName(id) {
    if (!id) return "Evento geral";

    const event = database.events.find(item => item.id === id);

    return event ? event.name : "Evento não encontrado";
}

function statusClass(status) {
    if (status === "Confirmada" || status === "Pago") {
        return "success";
    }

    if (status === "Não comparecerá") {
        return "danger";
    }

    return "pending";
}

function updateSelectOptions(selectId, defaultLabel) {
    const select = getElement(selectId);
    if (!select) return;

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">${escapeHTML(defaultLabel)}</option>
        ${database.events.map(event => `
            <option value="${escapeHTML(event.id)}">
                ${escapeHTML(event.name)}
            </option>
        `).join("")}
    `;

    if (database.events.some(event => event.id === previousValue)) {
        select.value = previousValue;
    }
}

/* ==========================================
   NAVEGAÇÃO / PÁGINA INICIAL
========================================== */

function renderDashboard() {
    if (document.body.dataset.page !== "inicio") return;

    const totalBudget = database.events.reduce(
        (sum, event) => sum + Number(event.budget || 0), 0
    );

    const totalExpenses = database.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0), 0
    );

    const confirmed = database.people.filter(
        person => person.status === "Confirmada"
    ).length;

    getElement("todayDate").textContent =
        new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

    getElement("totalEvents").textContent = database.events.length;
    getElement("totalPeople").textContent = database.people.length;
    getElement("confirmedPeople").textContent = confirmed;
    getElement("totalExpenses").textContent = money(totalExpenses);

    const upcoming = getElement("upcomingEvents");

    const futureEvents = [...database.events]
        .filter(event => !event.date || event.date >= todayISO())
        .sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.localeCompare(b.date);
        })
        .slice(0, 5);

    if (!futureEvents.length) {
        upcoming.innerHTML = `
            <p class="empty-state">
                🌸 Nenhuma confraternização futura cadastrada.
                <br>Comece criando seu primeiro evento!
            </p>
        `;
        return;
    }

    upcoming.innerHTML = futureEvents.map(event => `
        <div class="record-item">
            <div class="record-top">
                <div>
                    <h3>🏮 ${escapeHTML(event.name)}</h3>
                    <p>📅 ${formatDate(event.date)}
                    ${event.time ? " • ⏰ " + escapeHTML(event.time) : ""}</p>
                    <p>📍 ${escapeHTML(event.location || "Local não informado")}</p>
                </div>
                <span class="pill">${money(event.budget)}</span>
            </div>
        </div>
    `).join("");
}

/* ==========================================
   ORGANIZAÇÃO DOS EVENTOS
========================================== */

function renderEvents() {
    const container = getElement("eventsList");
    if (!container) return;

    if (!database.events.length) {
        container.innerHTML = `
            <p class="empty-state">
                🌸 Nenhuma confraternização cadastrada.
                <br>Utilize o formulário para criar seu primeiro evento.
            </p>
        `;
        return;
    }

    const sortedEvents = [...database.events].sort((a, b) =>
        (a.date || "").localeCompare(b.date || "")
    );

    container.innerHTML = sortedEvents.map(event => {
        const peopleCount = database.people.filter(
            person => person.eventId === event.id
        ).length;

        const expenses = database.expenses
            .filter(expense => expense.eventId === event.id)
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

        return `
            <article class="record-item">
                <div class="record-top">
                    <div>
                        <h3>🌸 ${escapeHTML(event.name)}</h3>
                        <p>📅 ${formatDate(event.date)}
                        ${event.time ? " • " + escapeHTML(event.time) : ""}</p>
                        <p>📍 ${escapeHTML(event.location || "Local não informado")}</p>
                    </div>
                    <span class="pill">${money(event.budget)}</span>
                </div>

                <div class="record-meta">
                    <span class="pill">🎀 ${peopleCount} pessoas</span>
                    <span class="pill">💴 ${money(expenses)} gastos</span>
                </div>

                ${event.description ? `
                    <p class="record-description">
                        ${escapeHTML(event.description)}
                    </p>
                ` : ""}

                <div class="record-actions">
                    <button class="small-action"
                        data-action="edit-event"
                        data-id="${escapeHTML(event.id)}">
                        ✏️ Editar
                    </button>

                    <button class="small-action delete"
                        data-action="delete-event"
                        data-id="${escapeHTML(event.id)}">
                        🗑 Excluir
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function resetEventForm() {
    getElement("eventForm").reset();
    getElement("eventId").value = "";
    getElement("eventFormTitle").textContent = "Cadastrar confraternização";
    getElement("eventSubmit").textContent = "🌸 Salvar evento";
    getElement("eventCancel").hidden = true;
}

function initializeEvents() {
    const form = getElement("eventForm");
    if (!form) return;

    renderEvents();

    getElement("eventDate").min = todayISO();

    form.addEventListener("submit", event => {
        event.preventDefault();

        const id = getElement("eventId").value;

        const eventData = {
            id: id || createId(),
            name: getElement("eventName").value.trim(),
            date: getElement("eventDate").value,
            time: getElement("eventTime").value,
            location: getElement("eventLocation").value.trim(),
            budget: Number(getElement("eventBudget").value || 0),
            description: getElement("eventDescription").value.trim()
        };

        if (!eventData.name || !eventData.date) {
            alert("Preencha o nome e a data do evento.");
            return;
        }

        if (id) {
            const index = database.events.findIndex(item => item.id === id);

            if (index !== -1) {
                database.events[index] = eventData;
            }
        } else {
            database.events.push(eventData);
        }

        if (!saveDatabase()) return;

        resetEventForm();
        renderEvents();

        alert(id
            ? "🌸 Confraternização atualizada!"
            : "🏮 Confraternização cadastrada com sucesso!"
        );
    });

    getElement("eventCancel").addEventListener("click", resetEventForm);

    getElement("eventsList").addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        const item = database.events.find(event => event.id === id);
        if (!item) return;

        if (action === "edit-event") {
            getElement("eventId").value = item.id;
            getElement("eventName").value = item.name;
            getElement("eventDate").value = item.date;
            getElement("eventTime").value = item.time || "";
            getElement("eventLocation").value = item.location || "";
            getElement("eventBudget").value = item.budget;
            getElement("eventDescription").value = item.description || "";

            getElement("eventFormTitle").textContent = "Editar confraternização";
            getElement("eventSubmit").textContent = "💗 Atualizar evento";
            getElement("eventCancel").hidden = false;

            getElement("eventForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (action === "delete-event") {
            const confirmed = confirm(
                `Deseja excluir "${item.name}"?\n\nAs pessoas e despesas vinculadas também serão excluídas.`
            );

            if (!confirmed) return;

            database.events = database.events.filter(event => event.id !== id);
            database.people = database.people.filter(person => person.eventId !== id);
            database.expenses = database.expenses.filter(expense => expense.eventId !== id);

            if (getElement("eventId").value === id) {
                resetEventForm();
            }

            saveDatabase();
            renderEvents();
        }
    });
}

/* ==========================================
   PESSOAS E CONVIDADOS
========================================== */

function renderPeople() {
    const container = getElement("peopleList");
    if (!container) return;

    const search = (getElement("personSearch").value || "").toLowerCase();

    const filtered = database.people.filter(person =>
        person.name.toLowerCase().includes(search) ||
        (person.phone || "").toLowerCase().includes(search) ||
        (person.email || "").toLowerCase().includes(search)
    );

    const confirmed = database.people.filter(
        person => person.status === "Confirmada"
    ).length;

    const pending = database.people.filter(
        person => person.status === "Pendente"
    ).length;

    getElement("peopleTotal").textContent = database.people.length;
    getElement("peopleConfirmed").textContent = confirmed;
    getElement("peoplePending").textContent = pending;

    if (!filtered.length) {
        container.innerHTML = `
            <p class="empty-state">
                🎀 Nenhuma pessoa encontrada.
            </p>
        `;
        return;
    }

    container.innerHTML = filtered.map(person => `
        <article class="record-item">
            <div class="record-top">
                <div>
                    <h3>🎀 ${escapeHTML(person.name)}</h3>
                    <p>📱 ${escapeHTML(person.phone || "Telefone não informado")}</p>
                    <p>✉️ ${escapeHTML(person.email || "E-mail não informado")}</p>
                </div>

                <span class="pill ${statusClass(person.status)}">
                    ${escapeHTML(person.status)}
                </span>
            </div>

            <div class="record-meta">
                <span class="pill">🏮 ${escapeHTML(getEventName(person.eventId))}</span>
            </div>

            ${person.notes ? `
                <p>📝 ${escapeHTML(person.notes)}</p>
            ` : ""}

            <div class="record-actions">
                <button class="small-action"
                    data-action="edit-person"
                    data-id="${escapeHTML(person.id)}">
                    ✏️ Editar
                </button>

                <button class="small-action delete"
                    data-action="delete-person"
                    data-id="${escapeHTML(person.id)}">
                    🗑 Excluir
                </button>
            </div>
        </article>
    `).join("");
}

function resetPersonForm() {
    getElement("personForm").reset();
    getElement("personId").value = "";
    getElement("personFormTitle").textContent = "Cadastrar pessoa";
    getElement("personSubmit").textContent = "🎀 Salvar pessoa";
    getElement("personCancel").hidden = true;
}

function initializePeople() {
    const form = getElement("personForm");
    if (!form) return;

    updateSelectOptions("personEvent", "Sem evento definido");
    renderPeople();

    form.addEventListener("submit", event => {
        event.preventDefault();

        const id = getElement("personId").value;

        const personData = {
            id: id || createId(),
            name: getElement("personName").value.trim(),
            phone: getElement("personPhone").value.trim(),
            email: getElement("personEmail").value.trim(),
            eventId: getElement("personEvent").value,
            status: getElement("personStatus").value,
            notes: getElement("personNotes").value.trim()
        };

        if (!personData.name) {
            alert("Informe o nome da pessoa.");
            return;
        }

        if (id) {
            const index = database.people.findIndex(person => person.id === id);

            if (index !== -1) {
                database.people[index] = personData;
            }
        } else {
            database.people.push(personData);
        }

        if (!saveDatabase()) return;

        resetPersonForm();
        renderPeople();

        alert(id
            ? "🎀 Pessoa atualizada!"
            : "🌸 Pessoa cadastrada com sucesso!"
        );
    });

    getElement("personCancel").addEventListener("click", resetPersonForm);

    getElement("personSearch").addEventListener("input", renderPeople);

    getElement("peopleList").addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        const person = database.people.find(item => item.id === id);
        if (!person) return;

        if (action === "edit-person") {
            getElement("personId").value = person.id;
            getElement("personName").value = person.name;
            getElement("personPhone").value = person.phone || "";
            getElement("personEmail").value = person.email || "";
            getElement("personEvent").value = person.eventId || "";
            getElement("personStatus").value = person.status;
            getElement("personNotes").value = person.notes || "";

            getElement("personFormTitle").textContent = "Editar pessoa";
            getElement("personSubmit").textContent = "💗 Atualizar pessoa";
            getElement("personCancel").hidden = false;

            getElement("personForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (action === "delete-person") {
            if (!confirm(`Deseja excluir ${person.name}?`)) return;

            database.people = database.people.filter(item => item.id !== id);

            if (getElement("personId").value === id) {
                resetPersonForm();
            }

            saveDatabase();
            renderPeople();
        }
    });
}

/* ==========================================
   FINANCEIRO
========================================== */

function renderFinance() {
    const container = getElement("expensesList");
    if (!container) return;

    const totalBudget = database.events.reduce(
        (sum, event) => sum + Number(event.budget || 0), 0
    );

    const totalExpenses = database.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0), 0
    );

    const balance = totalBudget - totalExpenses;

    getElement("financeBudget").textContent = money(totalBudget);
    getElement("financeExpenses").textContent = money(totalExpenses);
    getElement("financeBalance").textContent = money(balance);

    const search = (getElement("expenseSearch").value || "").toLowerCase();

    const filtered = database.expenses.filter(expense =>
        expense.description.toLowerCase().includes(search) ||
        expense.category.toLowerCase().includes(search)
    );

    if (!filtered.length) {
        container.innerHTML = `
            <p class="empty-state">
                💴 Nenhuma despesa encontrada.
            </p>
        `;
        return;
    }

    const sorted = [...filtered].sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
    );

    container.innerHTML = sorted.map(expense => `
        <article class="record-item">
            <div class="record-top">
                <div>
                    <h3>💴 ${escapeHTML(expense.description)}</h3>
                    <p>📅 ${formatDate(expense.date)}</p>
                    <p>🏮 ${escapeHTML(getEventName(expense.eventId))}</p>
                </div>

                <strong>${money(expense.amount)}</strong>
            </div>

            <div class="record-meta">
                <span class="pill">${escapeHTML(expense.category)}</span>
                <span class="pill ${expense.paid ? "success" : "pending"}">
                    ${expense.paid ? "Pago" : "Pendente"}
                </span>
            </div>

            <div class="record-actions">
                <button class="small-action"
                    data-action="edit-expense"
                    data-id="${escapeHTML(expense.id)}">
                    ✏️ Editar
                </button>

                <button class="small-action delete"
                    data-action="delete-expense"
                    data-id="${escapeHTML(expense.id)}">
                    🗑 Excluir
                </button>
            </div>
        </article>
    `).join("");
}

function resetExpenseForm() {
    getElement("expenseForm").reset();
    getElement("expenseId").value = "";
    getElement("expenseDate").value = todayISO();
    getElement("expenseFormTitle").textContent = "Registrar despesa";
    getElement("expenseSubmit").textContent = "💴 Salvar despesa";
    getElement("expenseCancel").hidden = true;
}

function initializeFinance() {
    const form = getElement("expenseForm");
    if (!form) return;

    updateSelectOptions("expenseEvent", "Despesa geral");
    getElement("expenseDate").value = todayISO();

    renderFinance();

    form.addEventListener("submit", event => {
        event.preventDefault();

        const id = getElement("expenseId").value;

        const expenseData = {
            id: id || createId(),
            description: getElement("expenseDescription").value.trim(),
            eventId: getElement("expenseEvent").value,
            category: getElement("expenseCategory").value,
            amount: Number(getElement("expenseAmount").value),
            date: getElement("expenseDate").value,
            paid: getElement("expensePaid").value === "true"
        };

        if (!expenseData.description || expenseData.amount <= 0 || !expenseData.date) {
            alert("Preencha a descrição, o valor e a data corretamente.");
            return;
        }

        if (id) {
            const index = database.expenses.findIndex(item => item.id === id);

            if (index !== -1) {
                database.expenses[index] = expenseData;
            }
        } else {
            database.expenses.push(expenseData);
        }

        if (!saveDatabase()) return;

        resetExpenseForm();
        renderFinance();

        alert(id
            ? "💴 Despesa atualizada!"
            : "🌸 Despesa cadastrada com sucesso!"
        );
    });

    getElement("expenseCancel").addEventListener("click", resetExpenseForm);

    getElement("expenseSearch").addEventListener("input", renderFinance);

    getElement("expensesList").addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        const expense = database.expenses.find(item => item.id === id);
        if (!expense) return;

        if (action === "edit-expense") {
            getElement("expenseId").value = expense.id;
            getElement("expenseDescription").value = expense.description;
            getElement("expenseEvent").value = expense.eventId || "";
            getElement("expenseCategory").value = expense.category;
            getElement("expenseAmount").value = expense.amount;
            getElement("expenseDate").value = expense.date;
            getElement("expensePaid").value = String(expense.paid);

            getElement("expenseFormTitle").textContent = "Editar despesa";
            getElement("expenseSubmit").textContent = "💗 Atualizar despesa";
            getElement("expenseCancel").hidden = false;

            getElement("expenseForm").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        if (action === "delete-expense") {
            if (!confirm(`Deseja excluir a despesa "${expense.description}"?`)) {
                return;
            }

            database.expenses = database.expenses.filter(item => item.id !== id);

            if (getElement("expenseId").value === id) {
                resetExpenseForm();
            }

            saveDatabase();
            renderFinance();
        }
    });
}

/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "inicio") {
        renderDashboard();
    }

    if (page === "organizacao") {
        initializeEvents();
    }

    if (page === "pessoas") {
        initializePeople();
    }

    if (page === "financeiro") {
        initializeFinance();
    }
});
