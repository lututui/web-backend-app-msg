/**
 * Perfil.controller.js — Controllers de perfil e busca de usuarios
 */

const Usuario = require('../classes/Usuario');
const Senha = require('../auth/Senha');
const Validador = require('../utils/Validador');
const Logger = require('../utils/Logger');
const { coletarErros, ehErroDeFormulario } = require('../utils/ValidacaoWeb');

const SENHA_MIN = 6;
const SENHA_MAX = 100;

// GET /perfil
function formularioPerfil(req, res) {
    res.render('perfil/editar', {
        titulo: 'Meu perfil',
        valores: {
            nome: req.usuario.nome,
            telefone: req.usuario.telefone,
            email: req.usuario.email
        }
    });
}


// POST /perfil
async function atualizarPerfil(req, res, next) {
    const { nome, telefone, email } = req.body;
    const { senhaAtual, novaSenha, confirmacaoNovaSenha } = req.body;

    // Valores re-exibidos em caso de erro
    const valores = { nome, telefone, email };

    function reexibir(erros, status) {
        return res.status(status || 400).render('perfil/editar', {
            titulo: 'Meu perfil',
            erros,
            valores
        });
    }

    try {
        const erros = coletarErros([
            () => Validador.validarCampoObrigatorio(nome, 'nome'),
            () => Validador.validarTamanho(nome, 2, 100, 'nome'),
            () => Validador.validarTelefone(telefone)
        ]);

        if (email && email.trim().length > 0) {
            try {
                Validador.validarEmail(email);
            } catch (erro) {
                erros.push(erro.message);
            }
        }

        // Troca de senha OPCIONAL
        const querTrocarSenha =
            (senhaAtual && senhaAtual.length > 0) ||
            (novaSenha && novaSenha.length > 0) ||
            (confirmacaoNovaSenha && confirmacaoNovaSenha.length > 0);

        let novoHash = null;

        if (querTrocarSenha) {
            const atualConfere = Senha.verificar(
                senhaAtual || '',
                req.usuario.senhaHash,
                req.usuario.senhaSalt
            );

            if (!atualConfere) {
                erros.push('A senha atual esta incorreta.');
            }

            try {
                Validador.validarCampoObrigatorio(novaSenha, 'nova senha');
                Validador.validarTamanho(
                    novaSenha,
                    SENHA_MIN,
                    SENHA_MAX,
                    'nova senha'
                );
            } catch (erro) {
                erros.push(erro.message);
            }

            if (novaSenha && novaSenha !== confirmacaoNovaSenha) {
                erros.push('A nova senha e a confirmacao nao coincidem.');
            }

            if (atualConfere &&
                novaSenha &&
                novaSenha.length >= SENHA_MIN &&
                novaSenha === confirmacaoNovaSenha) {
                novoHash = Senha.gerarHash(novaSenha);
            }
        }

        if (erros.length > 0) {
            return reexibir(erros);
        }

        req.usuario.nome = nome;
        req.usuario.telefone = telefone;
        req.usuario.email = email || '';

        if (novoHash) {
            req.usuario.senhaHash = novoHash.hash;
            req.usuario.senhaSalt = novoHash.salt;
        }

        await req.usuario.atualizar();

        Logger.info(
            `Perfil atualizado: ${req.usuario.id}`,
            'Perfil.atualizarPerfil'
        );

        res.flash('sucesso', 'Perfil atualizado com sucesso.');
        res.redirect('/perfil');
    } catch (erro) {
        if (ehErroDeFormulario(erro)) {
            return reexibir([erro.message]);
        }

        next(erro);
    }
}

// GET /usuarios/buscar
async function buscarUsuarios(req, res, next) {
    try {
        const termo = (req.query.q || '').trim();

        let resultados = [];

        if (termo.length > 0) {
            const encontrados = await Usuario.buscarPorNome(termo);
            
            resultados = encontrados
                .filter((u) => u.id.toString() !== String(req.usuario.id))
                .map((u) => ({
                    id: u.id,
                    nome: u.nome,
                    telefone: u.telefone
                }));
        }

        res.render('perfil/buscar', {
            titulo: 'Buscar usuarios',
            termo,
            buscou: termo.length > 0,
            resultados
        });
    } catch (erro) {
        next(erro);
    }
}

module.exports = { formularioPerfil, atualizarPerfil, buscarUsuarios };