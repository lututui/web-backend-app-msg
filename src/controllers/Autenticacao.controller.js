/**
 * Autenticacao.controller.js — Controllers de cadastro, login e logout
 */

const Usuario = require('../classes/Usuario');
const Senha = require('../auth/Senha');
const Validador = require('../utils/Validador');
const Logger = require('../utils/Logger');
const { coletarErros, ehErroDeFormulario } = require('../utils/ValidacaoWeb');

// Tamanho da senha.
const SENHA_MIN = 6;
const SENHA_MAX = 100;

// GET /cadastro
function formularioCadastro(req, res) {
    res.render('autenticacao/cadastro', { titulo: 'Cadastro', valores: {} });
}

// POST /cadastro
async function cadastrar(req, res) {
    const { nome, telefone, email, senha, confirmacaoSenha } = req.body;

    // Valores re-exibidos no formulario em caso de erro.
    const valores = { nome, telefone, email };

    // Validacao dos campos
    const erros = coletarErros([
        () => Validador.validarCampoObrigatorio(nome, 'nome'),
        () => Validador.validarTamanho(nome, 2, 100, 'nome'),
        () => Validador.validarTelefone(telefone),
        () => Validador.validarCampoObrigatorio(senha, 'senha'),
        () => Validador.validarTamanho(senha, SENHA_MIN, SENHA_MAX, 'senha')
    ]);

    // Email opcional
    if (email && email.trim().length > 0) {
        try {
            Validador.validarEmail(email);
        } catch (erro) {
            erros.push(erro.message);
        }
    }

    // Senha e confirmacao
    if (senha && senha !== confirmacaoSenha) {
        erros.push('A senha e a confirmação não coincidem.');
    }

    // Se ha erros de preenchimento, mostra o formulario
    if (erros.length > 0) {
        return res.status(400).render('autenticacao/cadastro', {
            titulo: 'Cadastro',
            erros,
            valores
        });
    }

    // Cria o usuario.
    const { hash, salt } = Senha.gerarHash(senha);
    const usuario = new Usuario({
        nome,
        telefone,
        email: email || '',
        senhaHash: hash,
        senhaSalt: salt
    });

    try {
        await usuario.criar();
    } catch (erro) {
        if (ehErroDeFormulario(erro)) {
            return res.status(400).render('autenticacao/cadastro', {
                titulo: 'Cadastro',
                erros: [erro.message],
                valores
            });
        }
        throw erro;
    }

    // Flash de sucesso e redirect para o login.
    res.flash('sucesso', 'Cadastro realizado com sucesso. Faça login.');
    res.redirect('/login');

}

// GET /login
function formularioLogin(req, res) {
    res.render('autenticacao/login', { titulo: 'Login', valores: {} });
}

// POST /login
async function logar(req, res) {
    const { telefone, senha } = req.body;
    const valores = { telefone };

    const erros = coletarErros([
        () => Validador.validarCampoObrigatorio(telefone, 'telefone'),
        () => Validador.validarCampoObrigatorio(senha, 'senha')
    ]);

    if (erros.length > 0) {
        return res.status(400).render('autenticacao/login', {
            titulo: 'Login',
            erros,
            valores
        });
    }

    // Busca o usuario e verifica a senha.
    const usuario = await Usuario.buscarPorTelefone(telefone);
    const senhaConfere =
        usuario &&
        Senha.verificar(senha, usuario.senhaHash, usuario.senhaSalt);

    // Senha ou telefone incorretos
    if (!senhaConfere) {
        return res.status(401).render('autenticacao/login', {
            titulo: 'Login',
            erros: ['Telefone ou senha inválidos.'],
            valores
        });
    }

    // Sucesso
    await new Promise((resolve, reject) => {
        req.session.regenerate((erro) => (erro ? reject(erro) : resolve()));
    });

    req.session.usuarioId = String(usuario.id);
    
    Logger.info(
        `Login efetuado: ${usuario.nome} (${usuario.id})`,
        'Autenticacao.logar'
    );

    res.flash('sucesso', `Bem-vindo(a), ${usuario.nome}!`);
    res.redirect('/conversas');
}

// POST /logout
async function logout(req, res) {
    await new Promise((resolve, reject) => {
        req.session.destroy((erro) => (erro ? reject(erro) : resolve()));
    });

    res.clearCookie('connect.sid');
    res.redirect('/login');
}

module.exports = {
    formularioCadastro,
    cadastrar,
    formularioLogin,
    logar,
    logout
};