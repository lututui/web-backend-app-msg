/**
 * App.js — Configuracao do Express
 *
 * Monta o objeto Express: 
 *      1. Registra os middlewares base
 *      2. Configura a view engine (hbs)
 *      3. Configura as rotas.
 *
 */

const path = require('path');
const express = require('express');
const hbs = require('hbs');

const app = express();

// Caminhos do projeto
const DIR_VIEWS = path.join(__dirname, 'views');                    // src/views
const DIR_PARTIALS = path.join(__dirname, 'views', 'partials');     // src/views/partials
const DIR_PUBLICO = path.join(__dirname, '..', 'public');           // public/

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estaticos (CSS, imagens)
app.use(express.static(DIR_PUBLICO));

// View engine
app.set('view engine', 'hbs');
app.set('views', DIR_VIEWS);
hbs.registerPartials(DIR_PARTIALS);

// Rota de teste
app.get('/', (req, res) => {
    res.send('Hello world');
});

/** 
 * Erros
 */

// 404
app.use((req, res) => {
    res.status(404).send('404 Pagina nao encontrada.');
});

// 500
app.use((erro, req, res, next) => {
    console.error('Erro nao tratado:', erro.message);
    res.status(500).send('500 Erro interno do servidor.');
});

module.exports = app;