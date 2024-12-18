const backendUrl =
  window.location.hostname === "177.66.14.144"
    ? "http://177.66.14.144:3000"
    : "http://192.168.15.206:3000";

let token = localStorage.getItem("token");
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 11;

// Formata números no padrão brasileiro
function formatNumber(number) {
  return new Intl.NumberFormat("pt-BR").format(number);
}

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
    // Mostra o loading enquanto os dados são carregados
    await fetchData();
  } catch (error) {
    console.error("Sessão expirada ou inválida:", error.message);
    localStorage.removeItem("token");
    showLoginModal();
  } finally {
    hideLoading();
  }
}

// Exporta os dados filtrados para XLSX
function downloadFilteredData() {
  // Mapeia os dados filtrados para um formato adequado para exportação
  const dataToExport = filteredData.flatMap((school) =>
    school.DETALHES.map((detail) => ({
      Município: school.MUNICIPIO,
      Escola: school.ESCOLA,
      Modalidade: detail.MODALIDADE,
      "Nível Ensino": detail.NIVEL_ENSINO,
      Ensino: detail.ENSINO,
      Fase: detail.FASE,
      "Turmas Tecnológicas": detail.TURMAS_TECNOLOGICO,
      "Alunos Tecnológicos": detail.ALUNOS_TECNOLOGICO,
      "Turmas Regulares": detail.TURMAS_REGULAR,
      "Alunos Regulares": detail.ALUNOS_REGULAR,
      "Turmas Totais": detail.TURMAS_TOTAL,
      "Alunos Totais": detail.ALUNOS_TOTAL,
    }))
  );

  // Cria a planilha
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Cria o livro e adiciona a planilha
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Filtrados");

  // Salva o arquivo XLSX
  XLSX.writeFile(workbook, "dados_escolas_2024.xlsx");
}

// Adiciona o evento de clique ao botão de download
document.getElementById("downloadButton").addEventListener("click", downloadFilteredData);

// Busca os dados da API
async function fetchData() {
  try {
    showLoading(); // Inicia o loading no início do carregamento
    const response = await fetch(`${backendUrl}/api/escolas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erro ao carregar os dados");

    // Atribui os dados diretamente sem reagrupamento
    allData = await response.json();
    filteredData = [...allData];
    renderTable();
    updateTotals();
  } catch (error) {
    console.error("Erro ao carregar os dados:", error.message);
    localStorage.removeItem("token");
    showLoginModal();
  } finally {
    hideLoading(); // Remove o loading após o carregamento
  }
}

// Atualiza os totais nos cards
function updateTotals() {
  const totalSchools = filteredData.length;
  const totalTurmas = filteredData.reduce(
    (acc, school) => acc + school.SUBTOTAL.TURMAS_TOTAL,
    0
  );
  const totalAlunos = filteredData.reduce(
    (acc, school) => acc + school.SUBTOTAL.ALUNOS_TOTAL,
    0
  );

  document.getElementById("totalSchools").textContent = formatNumber(totalSchools);
  document.getElementById("totalTurmas").textContent = formatNumber(totalTurmas);
  document.getElementById("totalAlunos").textContent = formatNumber(totalAlunos);
}

// Renderiza a tabela com dados agrupados por escola
function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = ""; // Limpa o corpo da tabela

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach((school, index) => {
    // Linha principal com os subtotais
    const mainRow = document.createElement("tr");
    mainRow.classList.add("clickable");
    mainRow.setAttribute("data-bs-toggle", "collapse");
    mainRow.setAttribute("data-bs-target", `#collapse-${index}`);
    mainRow.innerHTML = `
      <td>${school.MUNICIPIO}</td>
      <td><strong>${school.ESCOLA}</strong></td>
      <td>${formatNumber(school.SUBTOTAL.TURMAS_TECNOLOGICO)}</td>
      <td>${formatNumber(school.SUBTOTAL.ALUNOS_TECNOLOGICO)}</td>
      <td>${formatNumber(school.SUBTOTAL.TURMAS_REGULAR)}</td>
      <td>${formatNumber(school.SUBTOTAL.ALUNOS_REGULAR)}</td>      
      <td>${formatNumber(school.SUBTOTAL.TURMAS_TOTAL)}</td>
      <td>${formatNumber(school.SUBTOTAL.ALUNOS_TOTAL)}</td>
    `;
    tableBody.appendChild(mainRow);

    // Linha colapsável com os detalhes
    const collapseRow = document.createElement("tr");
    collapseRow.innerHTML = `
      <td colspan="8">
        <div class="collapse" id="collapse-${index}">
          <table class="table table-sm table-bordered mt-2">
            <thead>
              <tr>
                <th>Modalidade</th>
                <th>Nível Ensino</th>
                <th>Ensino</th>
                <th>Fase</th>
                <th>Turmas Tecnológicas</th>
                <th>Alunos Tecnológicos</th>
                <th>Turmas Regulares</th>
                <th>Alunos Regulares</th>
                <th>Turmas Totais</th>
                <th>Alunos Totais</th>
              </tr>
            </thead>
            <tbody>
              ${school.DETALHES.map(
                (detail) => `
                  <tr>
                    <td>${detail.MODALIDADE}</td>
                    <td>${detail.NIVEL_ENSINO}</td>
                    <td>${detail.ENSINO}</td>
                    <td>${detail.FASE}</td>
                    <td>${formatNumber(detail.TURMAS_TECNOLOGICO)}</td>
                    <td>${formatNumber(detail.ALUNOS_TECNOLOGICO)}</td>
                    <td>${formatNumber(detail.TURMAS_REGULAR)}</td>
                    <td>${formatNumber(detail.ALUNOS_REGULAR)}</td>
                    <td>${formatNumber(detail.TURMAS_TOTAL)}</td>
                    <td>${formatNumber(detail.ALUNOS_TOTAL)}</td>
                  </tr>
                `
              ).join("")}
            </tbody>
          </table>
        </div>
      </td>
    `;
    tableBody.appendChild(collapseRow);
  });

  renderPagination(); // Atualiza a paginação
}

// Renderiza a paginação ajustada
function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const maxVisiblePages = 5; // Máximo de botões visíveis

  const createPageButton = (label, page, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
    if (!disabled && !active) {
      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = page;
        renderTable();
      });
    }
    return li;
  };

  pagination.appendChild(createPageButton("Primeira", 1, currentPage === 1));
  pagination.appendChild(createPageButton("«", currentPage - 1, currentPage === 1));

  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  for (let i = startPage; i <= endPage; i++) {
    pagination.appendChild(createPageButton(i, i, false, currentPage === i));
  }

  pagination.appendChild(createPageButton("»", currentPage + 1, currentPage === totalPages));
  pagination.appendChild(createPageButton("Última", totalPages, currentPage === totalPages));
}

// Filtro
document.getElementById("filterInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  filteredData = allData.filter(
    (item) =>
      item.ESCOLA.toLowerCase().includes(filter) ||
      item.MUNICIPIO.toLowerCase().includes(filter)
  );
  currentPage = 1;
  renderTable();
  updateTotals();
});
