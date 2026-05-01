/**
 * Testes da classe Conversa
 *
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

// Usuários de teste (criados no setup)
let userAna, userBruno, userCarla, userDiego;

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
 * @param {Function} fn - função que deve lançar erro
 * @param {string|RegExp} mensagemEsperada - parte da mensagem ou regex
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
 * Cria os usuários base usados nos testes de conversa
 */
async function criarUsuariosBase() {
    userAna = new Usuario({ nome: 'Ana', telefone: '11911111111' });
    userBruno = new Usuario({ nome: 'Bruno', telefone: '11922222222' });
    userCarla = new Usuario({ nome: 'Carla', telefone: '11933333333' });
    userDiego = new Usuario({ nome: 'Diego', telefone: '11944444444' });

    await userAna.criar();
    await userBruno.criar();
    await userCarla.criar();
    await userDiego.criar();
}

// =================================================================
// CENÁRIOS DE TESTE
// =================================================================

async function testarCriacaoIndividual() {
    console.log('\n[Criação - Conversa Individual]');

    await teste('Conversa com 2 participantes', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });

        await conversa.criar();

        assert.ok(conversa.id, 'id deve ser atribuído após criar');
        assert.ok(conversa.dataCriacao instanceof Date, 'dataCriacao deve ser uma Date');
        assert.strictEqual(conversa.tipo, 'individual');
        assert.strictEqual(conversa.participantes.length, 2);
    });

    await teste('Conversa com 1 participante', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id]
        });

        await deveLancarErro(() => conversa.criar(), /exatamente 2 participantes/);
    });

    await teste('Conversa com 3 participantes', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id, userCarla.id]
        });

        await deveLancarErro(() => conversa.criar(), /exatamente 2 participantes/);
    });

    await teste('Participante inexistente', async () => {
        const idInexistente = '000000000000000000000000';
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, idInexistente]
        });

        await deveLancarErro(() => conversa.criar(), /Participante não encontrado/);
    });

    await teste('Participantes duplicados', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userAna.id]
        });

        await deveLancarErro(() => conversa.criar(), /duplicados/);
    });
}

async function testarCriacaoGrupo() {
    console.log('\n[Criação - Conversa em Grupo]');

    await teste('Grupo com nome e múltiplos participantes', async () => {
        const grupo = new Conversa({
            nome: 'Nome grupo',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id, userCarla.id]
        });

        await grupo.criar();

        assert.ok(grupo.id);
        assert.strictEqual(grupo.tipo, 'grupo');
        assert.strictEqual(grupo.nome, 'Nome grupo');
        assert.strictEqual(grupo.participantes.length, 3);
    });

    await teste('Grupo sem nome', async () => {
        const grupo = new Conversa({
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => grupo.criar(), /nome/);
    });

    await teste('Grupo com nome muito curto', async () => {
        const grupo = new Conversa({
            nome: 'A',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => grupo.criar(), /entre 2 e 100/);
    });

    await teste('Grupo com 1 participante', async () => {
        const grupo = new Conversa({
            nome: 'Grupo Pequeno',
            tipo: 'grupo',
            participantes: [userAna.id]
        });

        await deveLancarErro(() => grupo.criar(), /pelo menos 2 participantes/);
    });

    await teste('Tipo inválido', async () => {
        const conversa = new Conversa({
            tipo: 'broadcast',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => conversa.criar(), /tipo/);
    });

    await teste('Conversa sem participantes', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: []
        });

        await deveLancarErro(() => conversa.criar(), /participantes/);
    });

    await teste('Conversa com ID de participante inválido', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, 'id-invalido']
        });

        await deveLancarErro(() => conversa.criar(), /ID inválido/);
    });
}

async function testarBuscas() {
    console.log('\n[Buscas]');

    await Conexao.getColecao('conversas').deleteMany({});

    const conv1 = new Conversa({
        tipo: 'individual',
        participantes: [userAna.id, userBruno.id]
    });
    await conv1.criar();

    const conv2 = new Conversa({
        nome: 'Grupo de Estudos',
        tipo: 'grupo',
        participantes: [userAna.id, userCarla.id, userDiego.id]
    });
    await conv2.criar();

    const conv3 = new Conversa({
        tipo: 'individual',
        participantes: [userBruno.id, userCarla.id]
    });
    await conv3.criar();

    await teste('buscarPorId id existente', async () => {
        const encontrada = await Conversa.buscarPorId(conv1.id);

        assert.ok(encontrada, 'Conversa deve ser encontrada');
        assert.strictEqual(encontrada.tipo, 'individual');
        assert.strictEqual(encontrada.participantes.length, 2);
        assert.ok(encontrada instanceof Conversa, 'Deve retornar instância de Conversa');
    });

    await teste('buscarPorId id inexistente', async () => {
        const encontrada = await Conversa.buscarPorId('000000000000000000000000');
        assert.strictEqual(encontrada, null);
    });

    await teste('buscarPorId id inválido', async () => {
        await deveLancarErro(() => Conversa.buscarPorId('id-invalido'), /ID inválido/);
    });

    await teste('listarPorUsuario usuário com conversas', async () => {
        const conversasAna = await Conversa.listarPorUsuario(userAna.id);

        // Ana participa de conv1 (individual com Bruno) e conv2 (grupo)
        assert.strictEqual(conversasAna.length, 2, 'Ana deve estar em 2 conversas');
        assert.ok(conversasAna.every(c => c instanceof Conversa));
    });

    await teste('listarPorUsuario usuário sem conversas', async () => {
        const semConversas = new Usuario({
            nome: 'Sozinho',
            telefone: '11999999999'
        });
        await semConversas.criar();

        const lista = await Conversa.listarPorUsuario(semConversas.id);
        assert.strictEqual(lista.length, 0);
    });

    await teste('listarPorUsuario id inválido', async () => {
        await deveLancarErro(() => Conversa.listarPorUsuario('xyz'), /ID inválido/);
    });
}

async function testarParticipantes() {
    console.log('\n[Participantes]');

    await teste('temParticipante participante existente', async () => {
        const grupo = new Conversa({
            nome: 'Time A',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        assert.strictEqual(grupo.temParticipante(userAna.id), true);
    });

    await teste('temParticipante não-participante', async () => {
        const grupo = new Conversa({
            nome: 'Time B',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        assert.strictEqual(grupo.temParticipante(userCarla.id), false);
    });

    await teste('adicionarParticipante participante novo', async () => {
        const grupo = new Conversa({
            nome: 'Time C',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        await grupo.adicionarParticipante(userCarla.id);

        assert.strictEqual(grupo.participantes.length, 3);
        assert.ok(grupo.temParticipante(userCarla.id));

        // Verifica persistência no banco
        const recarregado = await Conversa.buscarPorId(grupo.id);
        assert.strictEqual(recarregado.participantes.length, 3);
    });

    await teste('adicionarParticipante conversa individual', async () => {
        const individual = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });
        await individual.criar();

        await deveLancarErro(
            () => individual.adicionarParticipante(userCarla.id),
            /grupos/
        );
    });

    await teste('adicionarParticipante participante já existente', async () => {
        const grupo = new Conversa({
            nome: 'Time D',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        await deveLancarErro(
            () => grupo.adicionarParticipante(userAna.id),
            /já é participante/
        );
    });

    await teste('adicionarParticipante usuário inexistente', async () => {
        const grupo = new Conversa({
            nome: 'Time E',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        await deveLancarErro(
            () => grupo.adicionarParticipante('000000000000000000000000'),
            /não encontrado/
        );
    });

    await teste('removerParticipante membro participante', async () => {
        const grupo = new Conversa({
            nome: 'Time F',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id, userCarla.id]
        });
        await grupo.criar();

        await grupo.removerParticipante(userCarla.id);

        assert.strictEqual(grupo.participantes.length, 2);
        assert.strictEqual(grupo.temParticipante(userCarla.id), false);

        // Verifica persistência
        const recarregado = await Conversa.buscarPorId(grupo.id);
        assert.strictEqual(recarregado.participantes.length, 2);
    });

    await teste('removerParticipante conversa individual', async () => {
        const individual = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });
        await individual.criar();

        await deveLancarErro(
            () => individual.removerParticipante(userAna.id),
            /grupos/
        );
    });

    await teste('removerParticipante grupo pequeno demais', async () => {
        const grupo = new Conversa({
            nome: 'Time G',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        await deveLancarErro(
            () => grupo.removerParticipante(userAna.id),
            /menos de 2 membros/
        );
    });

    await teste('removerParticipante não-participante', async () => {
        const grupo = new Conversa({
            nome: 'Time H',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id, userCarla.id]
        });
        await grupo.criar();

        await deveLancarErro(
            () => grupo.removerParticipante(userDiego.id),
            /não é participante/
        );
    });
}

async function testarAtualizacao() {
    console.log('\n[Atualização]');

    await teste('Atualizar nome de grupo', async () => {
        const grupo = new Conversa({
            nome: 'Nome Original',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        grupo.nome = 'Nome Atualizado';
        await grupo.atualizar();

        const recarregado = await Conversa.buscarPorId(grupo.id);
        assert.strictEqual(recarregado.nome, 'Nome Atualizado');
    });

    await teste('Atualizar grupo sem nome', async () => {
        const grupo = new Conversa({
            nome: 'Original',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        await grupo.criar();

        grupo.nome = '';
        await deveLancarErro(() => grupo.atualizar(), /nome/);
    });

    await teste('Atualizar sem id', async () => {
        const grupo = new Conversa({
            nome: 'Sem ID',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });
        // id é null porque não foi criado

        await deveLancarErro(() => grupo.atualizar(), /ID/);
    });

    await teste('Atualizar conversa inexistente', async () => {
        const grupo = new Conversa({
            id: '000000000000000000000001',
            nome: 'Fantasma',
            tipo: 'grupo',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => grupo.atualizar(), /não encontrada/);
    });
}

async function testarDelecao() {
    console.log('\n[Deleção]');

    await teste('Deletar conversa individual', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });
        await conversa.criar();
        const idSalvo = conversa.id;

        const resultado = await conversa.deletar();
        assert.strictEqual(resultado, true);

        const recarregada = await Conversa.buscarPorId(idSalvo);
        assert.strictEqual(recarregada, null);
    });

    await teste('Deve falhar ao deletar sem id', async () => {
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => conversa.deletar(), /ID/);
    });

    await teste('Deve falhar ao deletar conversa inexistente', async () => {
        const conversa = new Conversa({
            id: '000000000000000000000002',
            tipo: 'individual',
            participantes: [userAna.id, userBruno.id]
        });

        await deveLancarErro(() => conversa.deletar(), /não encontrada/);
    });
}

// =================================================================
// EXECUÇÃO PRINCIPAL
// =================================================================

async function executarTestes() {
    console.log('-'.repeat(60));
    console.log('  TESTES DA CLASSE Conversa');
    console.log('-'.repeat(60));

    try {
        await Conexao.conectar();
        console.log('\n[Setup] Conectado ao MongoDB. Limpando coleções...');
        await limparColecoes();
        await criarUsuariosBase();

        // Suítes
        await testarCriacaoIndividual();
        await testarCriacaoGrupo();
        await testarBuscas();
        await testarParticipantes();
        await testarAtualizacao();
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