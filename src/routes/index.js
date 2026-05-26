/**
 * index.js — Agregador de rotas
 */

const express = require('express');
const router = express.Router();

router.use(require('./Autenticacao.routes'));

module.exports = router;