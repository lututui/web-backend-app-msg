/**
 * Autenticacao.routes.js — Rotas de cadastro, login e logout
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Autenticacao.controller');
const asyncHandler = require('../middlewares/asyncHandler');
const { exigirLogin } = require('../middlewares/Autenticacao');

// Raiz: leva ao app se logado, ao login caso contrario
router.get('/', (req, res) => {
    res.redirect(req.usuario ? '/conversas' : '/login');
});

// Cadastro
router.get('/cadastro', asyncHandler(ctrl.formularioCadastro));
router.post('/cadastro', asyncHandler(ctrl.cadastrar));

// Login
router.get('/login', asyncHandler(ctrl.formularioLogin));
router.post('/login', asyncHandler(ctrl.logar));

// Logout (precisa estar logado)
router.post('/logout', exigirLogin, asyncHandler(ctrl.logout));

module.exports = router;