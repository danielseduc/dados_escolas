// Determina dinamicamente a URL do backend
const backendUrl = window.location.hostname === "172.16.17.70"
  ? "http://172.16.17.70:3000"
  : "http://localhost:3000";

let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 14;

document.addEventListener("DOMContentLoaded", () => {
  login();
});

async function login() {
  const username = "admin";
  const password = "senha123";

  try {
    const response = await fetch(`${backendUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) throw new Error("Falha no login");

    console.log("Login realizado com sucesso");
    fetchData();
  } catch (error) {
    console.error("Erro no login:", error);
  }
}

async function fetchData() {
  try {
    const response = await fetch(`${backendUrl}/api/escolas`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao carregar os dados");

    allData = await response.json();
    filteredData = [...allData]; // Inicialmente, os dados filtrados são iguais aos dados completos
    renderTable();
    renderPagination();
  } catch (error) {
    console.error("Erro ao carregar os dados:", error);
  }
}

// As funções renderTable, renderPagination e filtro permanecem inalteradas

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.cod_sigeam}</td>
      <td>${item.local}</td>
      <td>${item.municipio}</td>
      <td>${item.distrito || "-"}</td>
      <td>${item.escola}</td>
      <td>${item.endereco}</td>
      <td>${item.qtd_aluno_regular || "-"}</td>
      <td>${item.qtd_aluno_tecnologico || "-"}</td>
      <td>${item.qtd_aluno_total || "-"}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const maxPagesToShow = 5; // Número máximo de páginas a exibir na navegação
  const halfRange = Math.floor(maxPagesToShow / 2);

  const startPage = Math.max(1, currentPage - halfRange);
  const endPage = Math.min(totalPages, currentPage + halfRange);

  // Botão "Anterior"
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPagination();
    }
  });
  pagination.appendChild(prevLi);

  // Primeira página
  if (startPage > 1) {
    const firstLi = document.createElement("li");
    firstLi.className = "page-item";
    firstLi.innerHTML = `<a class="page-link" href="#">1</a>`;
    firstLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = 1;
      renderTable();
      renderPagination();
    });
    pagination.appendChild(firstLi);

    if (startPage > 2) {
      const dotsLi = document.createElement("li");
      dotsLi.className = "page-item disabled";
      dotsLi.innerHTML = `<a class="page-link" href="#">...</a>`;
      pagination.appendChild(dotsLi);
    }
  }

  // Páginas numéricas
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      renderTable();
      renderPagination();
    });
    pagination.appendChild(pageLi);
  }

  // Última página
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dotsLi = document.createElement("li");
      dotsLi.className = "page-item disabled";
      dotsLi.innerHTML = `<a class="page-link" href="#">...</a>`;
      pagination.appendChild(dotsLi);
    }

    const lastLi = document.createElement("li");
    lastLi.className = "page-item";
    lastLi.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
    lastLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = totalPages;
      renderTable();
      renderPagination();
    });
    pagination.appendChild(lastLi);
  }

  // Botão "Próximo"
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPagination();
    }
  });
  pagination.appendChild(nextLi);
}

// Filtro para tabela
document.getElementById("filterInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();

  if (filter === "") {
    // Se o filtro estiver vazio, restaure os dados originais
    filteredData = [...allData];
  } else {
    // Filtra os dados com base no texto digitado
    filteredData = allData.filter((item) =>
      Object.values(item).join(" ").toLowerCase().includes(filter)
    );
  }

  currentPage = 1; // Reseta para a primeira página ao aplicar o filtro
  renderTable();
  renderPagination();
});
