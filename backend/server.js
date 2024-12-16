require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/authRoutes");
const escolasRoutes = require("./routes/escolasRoutes");

const app = express();

// Configuração CORS
const allowedOrigins = process.env.FRONTEND_URL.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares globais
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: "Token ausente" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user; // Salva os dados do usuário decodificados
    next();
  });
}

// Rotas
app.use("/auth", authRoutes);
app.use("/api/escolas", authenticateToken, escolasRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
