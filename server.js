require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");

const app = express();

// Carrega variáveis do .env
const {
  NODE_ENV,
  SESSION_SECRET,
  API_KEY,
  FRONTEND_URL,
  API_URL,
} = process.env;

const allowedOrigins = process.env.FRONTEND_URL.split(",");

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origem não permitida pelo CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: NODE_ENV === "production", // Apenas HTTPS em produção
      httpOnly: true, // Evita acesso ao cookie via JS
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

// Dados fictícios de autenticação
const USERS = { admin: "senha123" };

// Rota de login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (USERS[username] && USERS[username] === password) {
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao criar sessão" });
      }
      req.session.user = username; // Salva o usuário na sessão
      res.json({ message: "Autenticado com sucesso" });
    });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

// Middleware para verificar sessão
function authMiddleware(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(403).json({ error: "Não autorizado" });
  }
  next();
}

// Endpoint protegido para buscar dados da API
app.get("/api/escolas", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao acessar a API:", error.message);
    res.status(500).send("Erro ao buscar os dados.");
  }
});

app.listen(3000, "0.0.0.0", () => console.log("Servidor rodando em http://localhost:3000/"));
