const backendUrl =
  window.location.hostname === "177.66.14.144"
    ? "http://177.66.14.144:3000"
    : "http://192.168.15.206:3000";

let token = localStorage.getItem("token"); // Recupera o token
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 8;

// Formata números no padrão brasileiro
function formatNumber(number) {
  return new Intl.NumberFormat("pt-BR").format(number);
}

// Verifica se o usuário já está logado
document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    verifySession();
  } else {
    showLoginModal();
  }
});

// Exibe o modal de login
function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password, loginModal);
  });
}

// Mostra o loading
function showLoading() {
  const loader = document.createElement("div");
  loader.id = "loadingIndicator";
  loader.style.position = "fixed";
  loader.style.top = "50%";
  loader.style.left = "50%";
  loader.style.transform = "translate(-50%, -50%)";
  loader.style.zIndex = "9999";
  loader.innerHTML = `
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>`;
  document.body.appendChild(loader);
}

// Remove o loading
function hideLoading() {
  const loader = document.getElementById("loadingIndicator");
  if (loader) loader.remove();
}

// Realiza o login
async function login(username, password, loginModal) {
  try {
    showLoading();
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error("Falha no login");

    const data = await response.json();
    token = data.token;
    localStorage.setItem("token", token); // Salva o token
    loginModal.hide();
    fetchData();
  } catch (error) {
    alert("Credenciais inválidas.");
    console.error("Erro no login:", error);
  } finally {
    hideLoading();
  }
}

// Verifica se o token é válido
async function verifySession() {
  showLoading();
  try {
    const response = await fetch(`${backendUrl}/api/escolas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Sessão inválida ou expirada");
    }

    console.log("Sessão válida. Token OK.");
    fetchData();
  } catch (error) {
    console.error("Sessão expirada ou inválida:", error.message);
    localStorage.removeItem("token");
    showLoginModal();
  } finally {
    hideLoading();
  }
}

// Busca os dados da API
async function fetchData() {
  showLoading();
  try {
    const response = await fetch(`${backendUrl}/api/escolas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erro ao carregar os dados");

    allData = await response.json();
    filteredData = [...allData];
    currentPage = 1;
    renderTable();
    renderPagination();
  } catch (error) {
    console.error("Erro ao carregar os dados:", error.message);
    localStorage.removeItem("token");
    showLoginModal();
  } finally {
    hideLoading();
  }
}

// Calcula totais para os cards
function calculateTotals() {
  const totals = {
    totalSchools: new Set(filteredData.map((item) => item.COD_ESCOLA)).size,
    totalTurmas: filteredData.reduce((acc, item) => acc + (parseInt(item.TURMAS_TOTAL) || 0), 0),
    totalAlunos: filteredData.reduce((acc, item) => acc + (parseInt(item.ALUNOS_TOTAL) || 0), 0),
  };

  return {
    totalSchools: formatNumber(totals.totalSchools),
    totalTurmas: formatNumber(totals.totalTurmas),
    totalAlunos: formatNumber(totals.totalAlunos),
  };
}

// Subtotais
function calculateSubtotals() {
  return filteredData.reduce(
    (acc, item) => {
      acc.TURMAS_TECNOLOGICO += parseInt(item.TURMAS_TECNOLOGICO) || 0;
      acc.ALUNOS_TECNOLOGICO += parseInt(item.ALUNOS_TECNOLOGICO) || 0;
      acc.TURMAS_REGULAR += parseInt(item.TURMAS_REGULAR) || 0;
      acc.ALUNOS_REGULAR += parseInt(item.ALUNOS_REGULAR) || 0;
      acc.TURMAS_TOTAL += parseInt(item.TURMAS_TOTAL) || 0;
      acc.ALUNOS_TOTAL += parseInt(item.ALUNOS_TOTAL) || 0;
      return acc;
    },
    {
      TURMAS_TECNOLOGICO: 0,
      ALUNOS_TECNOLOGICO: 0,
      TURMAS_REGULAR: 0,
      ALUNOS_REGULAR: 0,
      TURMAS_TOTAL: 0,
      ALUNOS_TOTAL: 0,
    }
  );
}

// Renderiza a tabela
function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.PROJETO || "-"}</td>
      <td>${item.GESTAO || "-"}</td>
      <td>${item.MUNICIPIO || "-"}</td>
      <td>${item.CDE || "-"}</td>
      <td>${item.COD_ESCOLA || "-"}</td>
      <td>${item.ESCOLA || "-"}</td>
      <td>${item.MODALIDADE || "-"}</td>
      <td>${item.NIVEL_ENSINO || "-"}</td>
      <td>${item.ENSINO || "-"}</td>
      <td>${item.FASE || "-"}</td>
      <td>${formatNumber(item.TURMAS_TECNOLOGICO || 0)}</td>
      <td>${formatNumber(item.ALUNOS_TECNOLOGICO || 0)}</td>
      <td>${formatNumber(item.TURMAS_REGULAR || 0)}</td>
      <td>${formatNumber(item.ALUNOS_REGULAR || 0)}</td>
      <td>${formatNumber(item.TURMAS_TOTAL || 0)}</td>
      <td>${formatNumber(item.ALUNOS_TOTAL || 0)}</td>
    `;
    tableBody.appendChild(row);
  });

  // Calcular subtotais
  const subtotals = calculateSubtotals();
  const subtotalRow = document.createElement("tr");
  subtotalRow.style.fontWeight = "bold"; // Negrito para destaque
  subtotalRow.innerHTML = `
    <td colspan="10" class="text-end"><strong>Subtotal</strong></td>
    <td>${formatNumber(subtotals.TURMAS_TECNOLOGICO)}</td>
    <td>${formatNumber(subtotals.ALUNOS_TECNOLOGICO)}</td>
    <td>${formatNumber(subtotals.TURMAS_REGULAR)}</td>
    <td>${formatNumber(subtotals.ALUNOS_REGULAR)}</td>
    <td>${formatNumber(subtotals.TURMAS_TOTAL)}</td>
    <td>${formatNumber(subtotals.ALUNOS_TOTAL)}</td>
  `;
  tableBody.appendChild(subtotalRow);

  // Atualiza os valores nos cards
  const totals = calculateTotals();
  document.getElementById("totalSchools").textContent = totals.totalSchools;
  document.getElementById("totalTurmas").textContent = totals.totalTurmas;
  document.getElementById("totalAlunos").textContent = totals.totalAlunos;
}

// Renderiza os controles de paginação
function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const maxPages = 5; // Número máximo de botões visíveis
  const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  const endPage = Math.min(totalPages, startPage + maxPages - 1);

  // Função auxiliar para criar um botão
  function createPageItem(page, label, disabled = false, active = false) {
    const li = document.createElement("li");
    li.className = `page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
    if (!disabled && !active) {
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = page;
        renderTable();
        renderPagination();
      });
    }
    return li;
  }

  // Botões Primeira e Anterior
  pagination.appendChild(createPageItem(1, "Primeira", currentPage === 1));
  pagination.appendChild(createPageItem(currentPage - 1, "&laquo;", currentPage === 1));

  // Botões de páginas numeradas
  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createPageItem(i, i, false, currentPage === i));
  }

  // Botões Próxima e Última
  pagination.appendChild(createPageItem(currentPage + 1, "&raquo;", currentPage === totalPages));
  pagination.appendChild(createPageItem(totalPages, "Última", currentPage === totalPages));
}

// Filtro de pesquisa
document.getElementById("filterInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();

  filteredData = allData.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(filter)
    )
  );

  currentPage = 1;
  renderTable();
  renderPagination();
});
