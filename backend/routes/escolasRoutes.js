const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const redis = require("redis");

const router = express.Router();
const redisClient = redis.createClient({
  url: "redis://redis:6379", // Configuração para o Docker
});

redisClient.connect().catch((err) => console.error("Erro ao conectar no Redis:", err));

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token ausente" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
};

// Middleware para verificar cache no Redis
const cacheMiddleware = async (req, res, next) => {
  const cacheKey = "escolas";
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Dados do cache retornados");
      return res.json(JSON.parse(cachedData));
    }
    req.cacheKey = cacheKey; // Salva a chave no request para posterior uso
    next();
  } catch (err) {
    console.error("Erro ao acessar o Redis:", err.message);
    next();
  }
};

// Rota protegida para buscar os dados reais
router.get("/", authenticateToken, cacheMiddleware, async (req, res) => {
  try {
    const response = await axios.get("http://192.168.15.212:8000/escolas_matriculas_totais/");
    const data = response.data;

    // Armazena os dados no Redis com expiração de 1 hora
    await redisClient.set(req.cacheKey, JSON.stringify(data), { EX: 3600 });

    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar dados da API externa:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados da API externa" });
  }
});

module.exports = router;
