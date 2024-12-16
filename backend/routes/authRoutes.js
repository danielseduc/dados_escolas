const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const USERS = { admin: "senha123" }; // Usuários fictícios

// Rota de login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (USERS[username] && USERS[username] === password) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

module.exports = router;
