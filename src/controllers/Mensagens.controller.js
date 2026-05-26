/**
 * Mensagens.controller.js — Controllers de mensagens
 */

const Mensagem = require('../classes/Mensagem');
const { carregarConversaPermitida } = require('../middlewares/Autorizacao');
const Validador = require('../utils/Validador');
const Logger = require('../utils/Logger');
const { ehErroDeFormulario } = require('../utils/ValidacaoWeb');

// Tamanho maximo do conteudo
const CONTEUDO_MAX = 4000;


// POST /conversas/:id/mensagens
async function enviar(req, res, next) {
    const conversaId = req.params.id;
    const conteudo = (req.body.conteudo || '').trim();

    try {
        const conversa = await carregarConversaPermitida(
            conversaId,
            req.usuario.id
        );

        const erros = [];

        if (conteudo.length === 0) {
            erros.push('A mensagem não pode ficar em branco.');
        }

        if (conteudo.length > CONTEUDO_MAX) {
            erros.push(
                `A mensagem excede o limite de ${CONTEUDO_MAX} caracteres.`
            );
        }

        if (erros.length > 0) {
            erros.forEach((e) => res.flash('erro', e));
            return res.redirect('/conversas/' + conversa.id);
        }

        const mensagem = new Mensagem({
            conversaId: conversa.id,
            remetenteId: req.usuario.id,
            conteudo
        });

        await mensagem.enviar();

        res.redirect('/conversas/' + conversa.id);
    } catch (erro) {
        Logger.error(erro, 'Mensagens.enviar');

        if (!ehErroDeFormulario(erro)) {
            return next(erro);
        }

        res.flash('erro', erro.message);
        res.redirect('/conversas/' + conversaId);
    }
}

// POST /mensagens/:id/lida
async function marcarLida(req, res, next) {
    try {
        Validador.validarId(req.params.id);

        const mensagem = await Mensagem.buscarPorId(req.params.id);

        if (!mensagem) {
            throw new Error('Mensagem não encontrada.');
        }

        await carregarConversaPermitida(mensagem.conversaId, req.usuario.id);

        const ehMinha = mensagem.remetenteId.toString() === String(req.usuario.id);

        if (ehMinha) {
            throw new Error('Você não pode marcar a própria mensagem como lida.');
        }

        await mensagem.marcarComoLida();

        res.flash('sucesso', 'Mensagem marcada como lida.');
        res.redirect('/conversas/' + mensagem.conversaId);
    } catch (erro) {
        Logger.error(erro, 'Mensagens.marcarLida');

        if (!ehErroDeFormulario(erro)) {
            return next(erro);
        }

        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

// POST /mensagens/:id/excluir
async function excluir(req, res, next) {
    try {
        Validador.validarId(req.params.id);

        const mensagem = await Mensagem.buscarPorId(req.params.id);

        if (!mensagem) {
            throw new Error('Mensagem não encontrada.');
        }

        await carregarConversaPermitida(mensagem.conversaId, req.usuario.id);

        const ehMinha = mensagem.remetenteId.toString() === String(req.usuario.id);
        
        if (!ehMinha) {
            throw new Error('Você só pode excluir as suas próprias mensagens.');
        }

        const conversaId = mensagem.conversaId;
        await mensagem.deletar();

        res.flash('sucesso', 'Mensagem excluída.');
        res.redirect('/conversas/' + conversaId);
    } catch (erro) {
        Logger.error(erro, 'Mensagens.excluir');
        
        if (!ehErroDeFormulario(erro)) {
            return next(erro);
        }
        
        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

module.exports = { enviar, marcarLida, excluir };