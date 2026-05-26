/**
 * index.js — Agregador de rotas
 */

const express = require('express');
const router = express.Router();

router.use(require('./Autenticacao.routes'));

router.use(require('./Conversas.routes'));

module.exports = router;