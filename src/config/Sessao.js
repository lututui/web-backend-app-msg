/**
 * Sessao.js — Configuracao da sessao do Express
 */

const session = require('express-session');

// Segredo da sessao
const SEGREDO = process.env.SESSAO_SEGREDO || 'app-msg-segredo-desenvolvimento';

// Validade da sessao: 2 horas.
const DURACAO_COOKIE = 2 * 60 * 60 * 1000;

const sessao = session({
    secret: SEGREDO,

    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: DURACAO_COOKIE
    }
});

module.exports = sessao;