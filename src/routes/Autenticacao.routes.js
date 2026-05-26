/**
 * Autenticacao.routes.js — Rotas de cadastro, login e logout
 */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/Autenticacao.controller');
const { exigirLogin } = require('../middlewares/Autenticacao');

// Raiz: leva ao app se logado, ao login caso contrario
router.get('/', (req, res) => {
    res.redirect(req.usuario ? '/conversas' : '/login');
});

// Cadastro
router.get('/cadastro', ctrl.formularioCadastro);
router.post('/cadastro', ctrl.cadastrar);

// Login
router.get('/login', ctrl.formularioLogin);
router.post('/login', ctrl.logar);

// Logout (precisa estar logado)
router.post('/logout', exigirLogin, ctrl.logout);

module.exports = router;