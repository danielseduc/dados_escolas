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
  const cacheKey = "escolas_agrupadas";
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

// Função para processar e agrupar os dados
const groupDataBySchool = (data) => {
  const groupedData = {};

  data.forEach((item) => {
    const key = item.COD_ESCOLA;
    if (!groupedData[key]) {
      groupedData[key] = {
        COD_ESCOLA: key,
        ESCOLA: item.ESCOLA,
        MUNICIPIO: item.MUNICIPIO,
        CDE: item.CDE,
        PROJETO: item.PROJETO,
        GESTAO: item.GESTAO,
        SUBTOTAL: {
          TURMAS_TECNOLOGICO: 0,
          ALUNOS_TECNOLOGICO: 0,
          TURMAS_REGULAR: 0,
          ALUNOS_REGULAR: 0,
          TURMAS_TOTAL: 0,
          ALUNOS_TOTAL: 0,
        },
        DETALHES: [],
      };
    }

    // Adiciona os detalhes para expansão
    groupedData[key].DETALHES.push({
      MODALIDADE: item.MODALIDADE,
      NIVEL_ENSINO: item.NIVEL_ENSINO,
      ENSINO: item.ENSINO,
      FASE: item.FASE,
      TURMAS_TECNOLOGICO: item.TURMAS_TECNOLOGICO,
      ALUNOS_TECNOLOGICO: item.ALUNOS_TECNOLOGICO,
      TURMAS_REGULAR: item.TURMAS_REGULAR,
      ALUNOS_REGULAR: item.ALUNOS_REGULAR,
      TURMAS_TOTAL: item.TURMAS_TOTAL,
      ALUNOS_TOTAL: item.ALUNOS_TOTAL,
    });

    // Calcula os subtotais
    groupedData[key].SUBTOTAL.TURMAS_TECNOLOGICO += parseInt(item.TURMAS_TECNOLOGICO) || 0;
    groupedData[key].SUBTOTAL.ALUNOS_TECNOLOGICO += parseInt(item.ALUNOS_TECNOLOGICO) || 0;
    groupedData[key].SUBTOTAL.TURMAS_REGULAR += parseInt(item.TURMAS_REGULAR) || 0;
    groupedData[key].SUBTOTAL.ALUNOS_REGULAR += parseInt(item.ALUNOS_REGULAR) || 0;
    groupedData[key].SUBTOTAL.TURMAS_TOTAL += parseInt(item.TURMAS_TOTAL) || 0;
    groupedData[key].SUBTOTAL.ALUNOS_TOTAL += parseInt(item.ALUNOS_TOTAL) || 0;
  });

  return Object.values(groupedData); // Retorna como um array
};

// Rota protegida para buscar os dados reais e agrupá-los
router.get("/", authenticateToken, cacheMiddleware, async (req, res) => {
  try {
    const response = await axios.get("http://192.168.15.212:8000/escolas_matriculas_totais/");
    const data = response.data;

    // Processa os dados para agrupamento
    const groupedData = groupDataBySchool(data);

    // Armazena os dados no Redis com expiração de 1 hora
    await redisClient.set(req.cacheKey, JSON.stringify(groupedData), { EX: 3600 });

    res.json(groupedData);
  } catch (error) {
    console.error("Erro ao buscar dados da API externa:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados da API externa" });
  }
});

module.exports = router;
