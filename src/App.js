/**
 * App.js — Configuracao do Express
 *
 * Monta o objeto Express: 
 *      1. Registra os middlewares base
 *      2. Configura a view engine (hbs)
 *      3. Configura as rotas.
 */

const path = require('path');
const express = require('express');
const hbs = require('hbs');

const sessao = require('./config/Sessao');
const flash = require('./middlewares/Flash');
const { carregarUsuario } = require('./middlewares/Autenticacao');
const { naoEncontrado, tratadorDeErro } = require('./middlewares/Erros');

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

hbs.registerHelper('ehIgual', function (a, b) {
    return String(a) === String(b);
});

hbs.registerHelper('ehGrupo', function (tipo) {
    return tipo === 'grupo';
});

hbs.registerHelper('incluiId', function (lista, id) {
    if (!Array.isArray(lista)) {
        return String(lista) === String(id);
    }

    return lista.some(function (item) {
        return String(item) === String(id);
    });
});

app.use(sessao);

app.use(flash);
app.use(carregarUsuario);

app.use(require('./routes'));

/*
// Rota de teste
app.get('/', (req, res) => {
    res.send('Hello world');
});
*/

// Erros
app.use(naoEncontrado);
app.use(tratadorDeErro);

module.exports = app;