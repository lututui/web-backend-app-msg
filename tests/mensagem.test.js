/**
 * Testes da classe Mensagem
 */

const assert = require('assert');

const Conexao = require('../src/database/Conexao');
const Usuario = require('../src/classes/Usuario');
const Conversa = require('../src/classes/Conversa');
const Mensagem = require('../src/classes/Mensagem');

// Contadores de resultados
let totalTestes = 0;
let testesAprovados = 0;
let testesFalhados = 0;
const falhas = [];

// Entidades de teste compartilhadas (criadas no setup)
let userAna, userBruno, userCarla, userDiego;
let conversaIndividual, conversaGrupo;

/**
 * Função auxiliar para executar um teste
 * @param {string} nome - descrição do teste
 * @param {Function} fn - função assíncrona contendo as asserções
 */
async function teste(nome, fn) {
    totalTestes++;
    try {
        await fn();
        testesAprovados++;
        console.log(`${nome}: OK`);
    } catch (erro) {
        testesFalhados++;
        falhas.push({ nome, erro });
        console.log(`${nome}: FAIL`);
        console.log(`${erro.message}`);
    }

    console.log('-'.repeat(60));
}

/**
 * Função auxiliar para verificar que uma operação assíncrona lança erro
 */
async function deveLancarErro(fn, mensagemEsperada) {
    let erroLancado = null;
    try {
        await fn();
    } catch (erro) {
        erroLancado = erro;
    }

    assert.ok(erroLancado, 'Esperava que o método lançasse um erro, mas nada foi lançado.');

    if (mensagemEsperada instanceof RegExp) {
        assert.ok(
            mensagemEsperada.test(erroLancado.message),
            `Mensagem não corresponde ao padrão. Recebida: "${erroLancado.message}"`
        );
    } else if (typeof mensagemEsperada === 'string') {
        assert.ok(
            erroLancado.message.includes(mensagemEsperada),
            `Esperava mensagem contendo "${mensagemEsperada}". Recebida: "${erroLancado.message}"`
        );
    }
}

/**
 * Limpa todas as coleções usadas pelos testes
 */
async function limparColecoes() {
    await Conexao.getColecao('mensagens').deleteMany({});
    await Conexao.getColecao('conversas').deleteMany({});
    await Conexao.getColecao('usuarios').deleteMany({});
}

/**
 * Limpa apenas as mensagens (mantém usuários e conversas base)
 */
async function limparMensagens() {
    await Conexao.getColecao('mensagens').deleteMany({});
}

async function criarEntidadesBase() {
    userAna = new Usuario({ nome: 'Ana', telefone: '11911111111' });
    userBruno = new Usuario({ nome: 'Bruno', telefone: '11922222222' });
    userCarla = new Usuario({ nome: 'Carla', telefone: '11933333333' });
    userDiego = new Usuario({ nome: 'Diego', telefone: '11944444444' });

    await userAna.criar();
    await userBruno.criar();
    await userCarla.criar();
    await userDiego.criar();

    conversaIndividual = new Conversa({
        tipo: 'individual',
        participantes: [userAna.id, userBruno.id]
    });
    await conversaIndividual.criar();

    conversaGrupo = new Conversa({
        nome: 'Grupo de Teste',
        tipo: 'grupo',
        participantes: [userAna.id, userBruno.id, userCarla.id]
    });
    await conversaGrupo.criar();
}

// =================================================================
// CENÁRIOS DE TESTE
// =================================================================

async function testarEnvio() {
    console.log('\n[Envio]');
    await limparMensagens();

    await teste('Mensagem em conversa individual', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'Olá, Bruno!'
        });

        await msg.enviar();

        assert.ok(msg.id, 'id deve ser atribuído');
        assert.ok(msg.timestamp instanceof Date, 'timestamp deve ser Date');
        assert.strictEqual(msg.status, 'enviada', 'status inicial deve ser "enviada"');
        assert.strictEqual(msg.conteudo, 'Olá, Bruno!');
    });

    await teste('Mensagem em conversa em grupo', async () => {
        const msg = new Mensagem({
            conversaId: conversaGrupo.id,
            remetenteId: userCarla.id,
            conteudo: 'Oi pessoal!'
        });

        await msg.enviar();
        assert.ok(msg.id);
    });

    await teste('Mensagem sem conversaId', async () => {
        const msg = new Mensagem({
            remetenteId: userAna.id,
            conteudo: 'sem conversa'
        });

        await deveLancarErro(() => msg.enviar(), /ID/);
    });

    await teste('Mensagem sem remetenteId', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            conteudo: 'sem remetente'
        });

        await deveLancarErro(() => msg.enviar(), /ID/);
    });

    await teste('Mensagem com conteúdo vazio', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: ''
        });

        await deveLancarErro(() => msg.enviar(), /conteudo/);
    });

    await teste('Mensagem com conteúdo apenas espaços', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: '   '
        });

        await deveLancarErro(() => msg.enviar(), /conteudo/);
    });

    await teste('Mensagem com conteúdo acima do limite (4000 chars)', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'a'.repeat(4001)
        });

        await deveLancarErro(() => msg.enviar(), /entre 1 e 4000/);
    });

    await teste('Mensagem para conversa inexistente', async () => {
        const msg = new Mensagem({
            conversaId: '000000000000000000000000',
            remetenteId: userAna.id,
            conteudo: 'olá'
        });

        await deveLancarErro(() => msg.enviar(), /Conversa não encontrada/);
    });

    await teste('Mensagem com remetente que não é participante', async () => {
        
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userDiego.id,
            conteudo: 'tentando invadir'
        });

        await deveLancarErro(() => msg.enviar(), /não é participante/);
    });

    await teste('Mensagem com conversaId inválido', async () => {
        const msg = new Mensagem({
            conversaId: 'id-invalido',
            remetenteId: userAna.id,
            conteudo: 'teste'
        });

        await deveLancarErro(() => msg.enviar(), /ID inválido/);
    });
}

async function testarBuscaPorId() {
    console.log('\n[Busca por ID]');
    await limparMensagens();

    const msg = new Mensagem({
        conversaId: conversaIndividual.id,
        remetenteId: userAna.id,
        conteudo: 'mensagem para buscar'
    });
    await msg.enviar();

    await teste('buscarPorId mensagem existente', async () => {
        const encontrada = await Mensagem.buscarPorId(msg.id);

        assert.ok(encontrada, 'Mensagem deve ser encontrada');
        assert.strictEqual(encontrada.conteudo, 'mensagem para buscar');
        assert.ok(encontrada instanceof Mensagem);
    });

    await teste('buscarPorId id inexistente', async () => {
        const encontrada = await Mensagem.buscarPorId('000000000000000000000000');
        assert.strictEqual(encontrada, null);
    });

    await teste('buscarPorId id inválido', async () => {
        await deveLancarErro(() => Mensagem.buscarPorId('xyz'), /ID inválido/);
    });

    await teste('buscarPorId id null', async () => {
        await deveLancarErro(() => Mensagem.buscarPorId(null), /ID/);
    });
}

async function testarBuscaPorConversa() {
    console.log('\n[Busca por Conversa]');
    await limparMensagens();

    // Cria 5 mensagens na conversa individual
    const conteudos = ['oi', 'tudo bem?', 'sim, e você?', 'também', 'ótimo!'];
    for (const conteudo of conteudos) {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo
        });
        await msg.enviar();
        
        // Timestamps distintos
        await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Cria 2 mensagens na conversa em grupo
    for (let i = 0; i < 2; i++) {
        const msg = new Mensagem({
            conversaId: conversaGrupo.id,
            remetenteId: userAna.id,
            conteudo: `grupo msg ${i}`
        });
        await msg.enviar();
    }

    await teste('Listar mensagens da conversa', async () => {
        const mensagens = await Mensagem.buscarPorConversa(conversaIndividual.id);

        assert.strictEqual(mensagens.length, 5);
        assert.ok(mensagens.every(m => m instanceof Mensagem));
    });

    await teste('Mensagens devem vir ordenadas por timestamp crescente', async () => {
        const mensagens = await Mensagem.buscarPorConversa(conversaIndividual.id);

        for (let i = 1; i < mensagens.length; i++) {
            assert.ok(
                mensagens[i - 1].timestamp <= mensagens[i].timestamp,
                'Lista deve estar em ordem crescente de timestamp'
            );
        }
    });

    await teste('Não deve incluir mensagens de outras conversas', async () => {
        const mensagens = await Mensagem.buscarPorConversa(conversaIndividual.id);

        // Nenhuma mensagem deve conter o texto "grupo msg"
        assert.ok(
            mensagens.every(m => !m.conteudo.startsWith('grupo')),
            'Apenas mensagens da conversa solicitada devem aparecer'
        );
    });

    await teste('Paginação com limite', async () => {
        const mensagens = await Mensagem.buscarPorConversa(conversaIndividual.id, 2);
        assert.strictEqual(mensagens.length, 2);
    });

    await teste('Paginação com offset', async () => {
        const todas = await Mensagem.buscarPorConversa(conversaIndividual.id, 50, 0);
        const pulando2 = await Mensagem.buscarPorConversa(conversaIndividual.id, 50, 2);

        assert.strictEqual(pulando2.length, todas.length - 2);
        
        assert.strictEqual(
            pulando2[0].id.toString(),
            todas[2].id.toString()
        );
    });

    await teste('Conversa sem mensagens deve retornar lista vazia', async () => {
        // Cria nova conversa sem mensagens
        const novaConversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userDiego.id]
        });
        await novaConversa.criar();

        const mensagens = await Mensagem.buscarPorConversa(novaConversa.id);
        assert.strictEqual(mensagens.length, 0);

        // Limpa para não afetar outros testes
        await novaConversa.deletar();
    });

    await teste('Limite inválido (0)', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorConversa(conversaIndividual.id, 0),
            /Limite/
        );
    });

    await teste('Limite inválido', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorConversa(conversaIndividual.id, 0),
            /Limite/
        );
    });

    await teste('Offset negativo', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorConversa(conversaIndividual.id, 50, -1),
            /Offset/
        );
    });

    await teste('conversaId inválido', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorConversa('xyz'),
            /ID inválido/
        );
    });
}

async function testarBuscaPorIntervalo() {
    console.log('\n[Busca por Intervalo]');
    await limparMensagens();

    const colecao = Conexao.getColecao('mensagens');

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    const semanaPassada = new Date();
    semanaPassada.setDate(semanaPassada.getDate() - 7);

    const mesPassado = new Date();
    mesPassado.setMonth(mesPassado.getMonth() - 1);

    // Cria 3 mensagens
    const msgs = [];
    for (let i = 0; i < 3; i++) {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: `msg ${i}`
        });
        await msg.enviar();
        msgs.push(msg);
    }

    // Ajusta os timestamps no banco
    await colecao.updateOne({ _id: msgs[0].id }, { $set: { timestamp: mesPassado } });
    await colecao.updateOne({ _id: msgs[1].id }, { $set: { timestamp: semanaPassada } });
    await colecao.updateOne({ _id: msgs[2].id }, { $set: { timestamp: ontem } });

    await teste('Buscar mensagens dos últimos 3 dias', async () => {
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - 3);
        const fim = new Date();

        const resultados = await Mensagem.buscarPorIntervalo(
            conversaIndividual.id,
            inicio,
            fim
        );

        // Apenas a mensagem de "ontem" deve aparecer
        assert.strictEqual(resultados.length, 1);
        assert.strictEqual(resultados[0].conteudo, 'msg 2');
    });

    await teste('Buscar mensagens dos últimos 10 dias', async () => {
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - 10);
        const fim = new Date();

        const resultados = await Mensagem.buscarPorIntervalo(
            conversaIndividual.id,
            inicio,
            fim
        );

        // "ontem" e "semana passada" devem aparecer
        assert.strictEqual(resultados.length, 2);
    });

    await teste('Intervalo sem mensagens', async () => {
        const inicio = new Date();
        inicio.setFullYear(inicio.getFullYear() - 5);
        const fim = new Date();
        fim.setFullYear(fim.getFullYear() - 4);

        const resultados = await Mensagem.buscarPorIntervalo(
            conversaIndividual.id,
            inicio,
            fim
        );

        assert.strictEqual(resultados.length, 0);
    });

    await teste('Falha com dataInicio > dataFim', async () => {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const hoje = new Date();

        await deveLancarErro(
            () => Mensagem.buscarPorIntervalo(conversaIndividual.id, hoje, ontem),
            /anterior ou igual/
        );
    });

    await teste('Falha com data inválida', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorIntervalo(conversaIndividual.id, 'não-é-data', new Date()),
            /Data inválida/
        );
    });

    await teste('Falha com conversaId inválido', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorIntervalo('xyz', new Date(), new Date()),
            /ID inválido/
        );
    });
}

async function testarBuscaPorTexto() {
    console.log('\n[Busca por Texto]');
    await limparMensagens();

    const conteudos = [
        'Olá, bom dia!',
        'Como vai o projeto?',
        'O projeto está atrasado',
        'Bom trabalho pessoal',
        'Vamos almoçar juntos?'
    ];

    for (const conteudo of conteudos) {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo
        });
        await msg.enviar();
        await new Promise(resolve => setTimeout(resolve, 5));
    }

    await teste('buscarPorTexto palavra em múltiplas mensagens', async () => {
        const resultados = await Mensagem.buscarPorTexto(conversaIndividual.id, 'projeto');
        assert.strictEqual(resultados.length, 2);
    });

    await teste('buscarPorTexto case-insensitive', async () => {
        const resultados = await Mensagem.buscarPorTexto(conversaIndividual.id, 'PROJETO');
        assert.strictEqual(resultados.length, 2);
    });

    await teste('buscarPorTexto palavra em uma mensagem', async () => {
        const resultados = await Mensagem.buscarPorTexto(conversaIndividual.id, 'almoçar');
        assert.strictEqual(resultados.length, 1);
        assert.ok(resultados[0].conteudo.includes('almoçar'));
    });

    await teste('buscarPorTexto texto inexistente', async () => {
        const resultados = await Mensagem.buscarPorTexto(conversaIndividual.id, 'jantar');
        assert.strictEqual(resultados.length, 0);
    });

    await teste('buscarPorTexto texto vazio', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorTexto(conversaIndividual.id, ''),
            /texto/
        );
    });

    await teste('buscarPorTexto conversaId inválido', async () => {
        await deveLancarErro(
            () => Mensagem.buscarPorTexto('xyz', 'oi'),
            /ID inválido/
        );
    });
}

async function testarStatus() {
    console.log('\n[Atualização de Status]');
    await limparMensagens();

    await teste('atualizarStatus para "entregue"', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'teste status'
        });
        await msg.enviar();

        await msg.atualizarStatus('entregue');
        assert.strictEqual(msg.status, 'entregue');

        const recarregada = await Mensagem.buscarPorId(msg.id);
        assert.strictEqual(recarregada.status, 'entregue');
    });

    await teste('marcarComoLida', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'marcar lida'
        });
        await msg.enviar();

        await msg.marcarComoLida();
        assert.strictEqual(msg.status, 'lida');

        const recarregada = await Mensagem.buscarPorId(msg.id);
        assert.strictEqual(recarregada.status, 'lida');
    });

    await teste('status inválido', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'teste'
        });
        await msg.enviar();

        await deveLancarErro(() => msg.atualizarStatus('arquivada'), /status/);
    });

    await teste('atualizar status sem id', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'sem id'
        });
        // não chamou enviar(), então id é null

        await deveLancarErro(() => msg.atualizarStatus('lida'), /ID/);
    });

    await teste('atualizar mensagem inexistente', async () => {
        const msg = new Mensagem({
            id: '000000000000000000000001',
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'fantasma'
        });

        await deveLancarErro(() => msg.atualizarStatus('lida'), /não encontrada/);
    });
}

async function testarDelecao() {
    console.log('\n[Deleção]');
    await limparMensagens();

    await teste('Deletar mensagem existente', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'para deletar'
        });
        await msg.enviar();
        const idSalvo = msg.id;

        const resultado = await msg.deletar();
        assert.strictEqual(resultado, true);

        const recarregada = await Mensagem.buscarPorId(idSalvo);
        assert.strictEqual(recarregada, null);
    });

    await teste('Deletar mensagem sem id', async () => {
        const msg = new Mensagem({
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'sem id'
        });

        await deveLancarErro(() => msg.deletar(), /ID/);
    });

    await teste('Deletar mensagem inexistente', async () => {
        const msg = new Mensagem({
            id: '000000000000000000000002',
            conversaId: conversaIndividual.id,
            remetenteId: userAna.id,
            conteudo: 'fantasma'
        });

        await deveLancarErro(() => msg.deletar(), /não encontrada/);
    });
}

// =================================================================
// EXECUÇÃO PRINCIPAL
// =================================================================

async function executarTestes() {
    console.log('-'.repeat(60));
    console.log('  TESTES DA CLASSE Mensagem');
    console.log('-'.repeat(60));

    try {
        await Conexao.conectar();
        console.log('\n[Setup] Conectado ao MongoDB. Limpando coleções...');
        await limparColecoes();
        await criarEntidadesBase();

        // Suítes
        await testarEnvio();
        await testarBuscaPorId();
        await testarBuscaPorConversa();
        await testarBuscaPorIntervalo();
        await testarBuscaPorTexto();
        await testarStatus();
        await testarDelecao();

        console.log('\n[Cleanup] Limpando coleções de teste...');
        await limparColecoes();
    } catch (erro) {
        console.error('\nErro durante a execução dos testes:');
        console.error(`  ${erro.message}`);
        if (erro.stack) {
            console.error(erro.stack);
        }
        process.exitCode = 1;
    } finally {
        try {
            await Conexao.desconectar();
        } catch (erro) {
            console.error(`Erro ao desconectar: ${erro.message}`);
        }
    }

    // Resumo final
    console.log('\n' + '-'.repeat(60));
    console.log('  RESUMO');
    console.log('-'.repeat(60));
    console.log(`  Total:     ${totalTestes}`);
    console.log(`  Aprovados: ${testesAprovados}`);
    console.log(`  Falhados:  ${testesFalhados}`);

    if (testesFalhados > 0) {
        console.log('\n  Detalhes das falhas:');
        falhas.forEach(({ nome, erro }, i) => {
            console.log(`\n  ${i + 1}. ${nome}`);
            console.log(`     ${erro.message}`);
        });
        process.exitCode = 1;
    } else {
        console.log('\nTodos os testes passaram!');
    }
    console.log('-'.repeat(60));
}

executarTestes();