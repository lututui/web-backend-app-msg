/**
 * Conversas.controller.js — Controllers de conversas
 */

const Conversa = require('../classes/Conversa');
const Mensagem = require('../classes/Mensagem');
const Usuario = require('../classes/Usuario');
const { carregarConversaPermitida } = require('../middlewares/Autorizacao');
const Logger = require('../utils/Logger');
const { ehErroDeFormulario } = require('../utils/ValidacaoWeb');
const ResolvedorNomes = require('../utils/ResolvedorNomes');

/**
 * Monta um rotulo de exibicao para a conversa.
 * 
 * Grupo: usa o nome do grupo. 
 * Individual: usa o nome do outro participante.
 * 
 * @param {Conversa} conversa
 * @param {string} usuarioIdLogado
 * @returns {Promise<{ nome: string, telefone: string }>}
 */
async function rotularConversa(conversa, usuarioIdLogado) {
    if (conversa.tipo === 'grupo') {
        return { nome: conversa.nome || 'Grupo sem nome', telefone: '' };
    }

    const outroId = conversa.participantes.find(
        (p) => p.toString() !== String(usuarioIdLogado)
    );

    if (!outroId) {
        return { nome: 'Conversa', telefone: '' };
    }

    const outro = await Usuario.buscarPorId(outroId);

    if (!outro) {
        return { nome: 'Usuário removido', telefone: '' };
    }

    return { nome: outro.nome, telefone: outro.telefone };
}

// GET /conversas
async function listar(req, res) {
    const conversas = await Conversa.listarPorUsuario(req.usuario.id);

    // Roluto de cada conversa
    const lista = [];
    for (const conversa of conversas) {
        const rotulo = await rotularConversa(conversa, req.usuario.id);

        lista.push({
            id: conversa.id,
            tipo: conversa.tipo,
            rotulo: rotulo.nome,
            telefone: rotulo.telefone,
            qtdParticipantes: conversa.participantes.length,
            dataCriacao: conversa.dataCriacao
        });
    }

    res.render('conversas/lista', {
        titulo: 'Conversas',
        conversas: lista
    });
}

// GET /conversas/nova
async function formularioNovaIndividual(req, res) {
    const todos = await Usuario.listarTodos();
    const outros = todos
        .filter((u) => u.id.toString() !== String(req.usuario.id))
        .map((u) => ({ id: u.id, nome: u.nome, telefone: u.telefone }));

    res.render('conversas/nova', {
        titulo: 'Nova conversa',
        usuarios: outros,
        valores: {}
    });
}

// GET /conversas/grupo — formulario de novo GRUPO
async function formularioNovoGrupo(req, res) {
    const todos = await Usuario.listarTodos();
    const outros = todos
        .filter((u) => u.id.toString() !== String(req.usuario.id))
        .map((u) => ({ id: u.id, nome: u.nome, telefone: u.telefone }));

    res.render('conversas/grupo', {
        titulo: 'Novo grupo',
        usuarios: outros,
        valores: {}
    });
}

// POST /conversas
async function criar(req, res) {
    const { tipo, nome } = req.body;

    // participantes: string ou array
    let participantes = req.body.participantes || [];
    if (!Array.isArray(participantes)) {
        participantes = [participantes];
    }

    // Re-exibe o formulario de nova conversa
    async function reexibir(erros) {
        const todos = await Usuario.listarTodos();

        const outros = todos
            .filter((u) => u.id.toString() !== String(req.usuario.id))
            .map((u) => ({ id: u.id, nome: u.nome, telefone: u.telefone }));

        const template = tipo === 'grupo' ? 'conversas/grupo' : 'conversas/nova';
        const titulo = tipo === 'grupo' ? 'Novo grupo' : 'Nova conversa';

        return res.status(400).render(template, {
            titulo,
            usuarios: outros,
            erros,
            valores: { tipo, nome, participantes }
        });
    }

    try {
        const erros = [];

        if (tipo !== 'individual' && tipo !== 'grupo') {
            erros.push('Selecione o tipo da conversa.');
        }

        if (participantes.length < 1) {
            erros.push('Selecione ao menos um participante.');
        }

        if (tipo === 'individual' && participantes.length !== 1) {
            erros.push('Conversa individual deve ter exatamente um contato.');
        }

        if (tipo === 'grupo' && (!nome || nome.trim().length < 2)) {
            erros.push('Grupos precisam de um nome com ao menos 2 caracteres.');
        }

        if (erros.length > 0) {
            return reexibir(erros);
        }

        const listaParticipantes = [String(req.usuario.id), ...participantes];

        if (tipo === 'individual') {
            const existentes = await Conversa.listarPorUsuario(req.usuario.id);
            const alvo = participantes[0];
            const jaExiste = existentes.find(
                (c) =>
                    c.tipo === 'individual' &&
                    c.participantes.some((p) => p.toString() === String(alvo))
            );

            if (jaExiste) {
                res.flash('sucesso', 'Você já tem uma conversa com esse contato.');
                return res.redirect('/conversas/' + jaExiste.id);
            }
        }

        const conversa = new Conversa({
            tipo,
            nome: tipo === 'grupo' ? nome : '',
            participantes: listaParticipantes
        });

        await conversa.criar();

        res.flash('sucesso', 'Conversa criada.');
        res.redirect('/conversas/' + conversa.id);
    } catch (erro) {
        Logger.error(erro, 'Conversas.criar');

        if (ehErroDeFormulario(erro)) {
            return reexibir([erro.message]);
        }

        throw erro;
    }
}

// GET /conversas/:id
async function abrir(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        const mensagens = await Mensagem.buscarPorConversa(conversa.id);

        const nomeDe = ResolvedorNomes.criar();

        const listaMensagens = [];
        for (const m of mensagens) {
            listaMensagens.push({
                id: m.id,
                conteudo: m.conteudo,
                status: m.status,
                timestamp: m.timestamp,
                remetenteNome: await nomeDe(m.remetenteId),
                ehMinha: m.remetenteId.toString() === String(req.usuario.id)
            });
        }

        // Marcar mensagens como lidas
        if (conversa.tipo === 'individual') {
            for (const m of mensagens) {
                const recebida =
                    m.remetenteId.toString() !== String(req.usuario.id);

                if (recebida && m.status !== 'lida') {
                    await m.marcarComoLida();
                }
            }
        }

        let usuariosDisponiveis = [];

        if (conversa.tipo === 'grupo') {
            const todos = await Usuario.listarTodos();
            usuariosDisponiveis = todos
                .filter((u) => !conversa.temParticipante(u.id))
                .map((u) => ({ id: u.id, nome: u.nome }));
        }

        const rotulo = await rotularConversa(conversa, req.usuario.id);

        res.render('conversas/detalhe', {
            titulo: rotulo.nome,
            conversa: {
                id: conversa.id,
                tipo: conversa.tipo,
                ehGrupo: conversa.tipo === 'grupo',
                rotulo: rotulo.nome,
                telefone: rotulo.telefone
            },
            mensagens: listaMensagens,
            usuariosDisponiveis,
            termoBusca: ''
        });
    } catch (erro) {
        Logger.error(erro, 'Conversas');

        if (!ehErroDeFormulario(erro)) {
            throw erro;
        }

        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

// GET /conversas/:id/buscar
async function buscarMensagens(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        const termo = (req.query.q || '').trim();

        if (termo.length === 0) {
            return res.redirect('/conversas/' + conversa.id);
        }

        const encontradas = await Mensagem.buscarPorTexto(conversa.id, termo);

        const nomeDe = ResolvedorNomes.criar();

        const resultados = [];
        for (const m of encontradas) {
            resultados.push({
                id: m.id,
                conteudo: m.conteudo,
                status: m.status,
                timestamp: m.timestamp,
                remetenteNome: await nomeDe(m.remetenteId),
                ehMinha: m.remetenteId.toString() === String(req.usuario.id)
            });
        }

        const rotulo = await rotularConversa(conversa, req.usuario.id);
        res.render('conversas/detalhe', {
            titulo: 'Busca · ' + rotulo.nome,
            conversa: {
                id: conversa.id,
                tipo: conversa.tipo,
                ehGrupo: conversa.tipo === 'grupo',
                rotulo: rotulo.nome,
                telefone: rotulo.telefone
            },
            mensagens: resultados,
            participantes: [],
            termoBusca: termo,
            modoBusca: true
        });
    } catch (erro) {
        Logger.error(erro, 'Conversas');

        if (!ehErroDeFormulario(erro)) {
            throw erro;
        }

        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

// GET /conversas/:id/membros
async function membros(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        if (conversa.tipo !== 'grupo') {
            res.flash('erro', 'Esta conversa nao e um grupo.');
            return res.redirect('/conversas/' + conversa.id);
        }

        const participantes = [];
        for (const pid of conversa.participantes) {
            const u = await Usuario.buscarPorId(pid);
            participantes.push({
                id: pid,
                nome: u ? u.nome : 'Usuario removido',
                ehEu: pid.toString() === String(req.usuario.id)
            });
        }

        const todos = await Usuario.listarTodos();
        const idsParticipantes = new Set(
            conversa.participantes.map((p) => p.toString())
        );

        const disponiveis = todos
            .filter((u) => !idsParticipantes.has(u.id.toString()))
            .map((u) => ({ id: u.id, nome: u.nome, telefone: u.telefone }));

        res.render('conversas/membros', {
            titulo: conversa.nome || 'Grupo',
            conversa: {
                id: conversa.id,
                nome: conversa.nome || 'Grupo sem nome'
            },
            participantes,
            disponiveis
        });
    } catch (erro) {
        if (!ehErroDeFormulario(erro)) {
            throw erro;
        }

        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

// POST /conversas/:id/participantes
async function adicionarParticipante(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        await conversa.adicionarParticipante(req.body.usuarioId);
        res.flash('sucesso', 'Participante adicionado.');
    } catch (erro) {
        Logger.error(erro, 'Conversas.adicionarParticipante');
        res.flash('erro', erro.message);
    }

    res.redirect('/conversas/' + req.params.id + '/membros');
}

// POST /conversas/:id/participantes/remover
async function removerParticipante(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        await conversa.removerParticipante(req.body.usuarioId);
        res.flash('sucesso', 'Participante removido.');
    } catch (erro) {
        Logger.error(erro, 'Conversas.removerParticipante');
        res.flash('erro', erro.message);
    }

    res.redirect('/conversas/' + req.params.id + '/membros');
}

// POST /conversas/:id/excluir
async function excluir(req, res) {
    try {
        const conversa = await carregarConversaPermitida(
            req.params.id,
            req.usuario.id
        );

        await conversa.deletar();
        res.flash('sucesso', 'Conversa excluída.');
        res.redirect('/conversas');
    } catch (erro) {
        Logger.error(erro, 'Conversas.excluir');
        res.flash('erro', erro.message);
        res.redirect('/conversas');
    }
}

module.exports = {
    listar,
    formularioNovaIndividual,
    formularioNovoGrupo,
    criar,
    abrir,
    buscarMensagens,
    membros,
    adicionarParticipante,
    removerParticipante,
    excluir
};