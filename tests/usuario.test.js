/**
 * Testes da classe Usuario
 */

const assert = require('assert');

const Conexao = require('../src/database/Conexao');
const Usuario = require('../src/classes/Usuario');

// Contadores de resultados
let totalTestes = 0;
let testesAprovados = 0;
let testesFalhados = 0;
const falhas = [];

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
 * Limpa a coleção de usuários antes/depois dos testes
 */
async function limparColecao() {
    const colecao = Conexao.getColecao('usuarios');
    await colecao.deleteMany({});
}

// =================================================================
// CENÁRIOS DE TESTE
// =================================================================

async function testarCriacao() {
    console.log('\n[Criação]');

    await teste('Usuário com dados válidos', async () => {
        const usuario = new Usuario({
            nome: 'João',
            telefone: '11987654321',
            email: 'joao@example.com'
        });

        await usuario.criar();

        assert.ok(usuario.id, 'id deve ser atribuído após criar');
        assert.ok(usuario.dataCriacao instanceof Date, 'dataCriacao deve ser uma Date');
        assert.strictEqual(usuario.nome, 'João');
    });

    await teste('Usuário sem email (opcional)', async () => {
        const usuario = new Usuario({
            nome: 'Maria',
            telefone: '11912345678'
        });

        await usuario.criar();
        assert.ok(usuario.id);
    });

    await teste('Usuário sem nome', async () => {
        const usuario = new Usuario({
            telefone: '11900000001'
        });

        await deveLancarErro(() => usuario.criar(), 'nome');
    });

    await teste('Usuário sem telefone', async () => {
        const usuario = new Usuario({
            nome: 'Sem Telefone'
        });

        await deveLancarErro(() => usuario.criar(), 'telefone');
    });

    await teste('Nome muito curto', async () => {
        const usuario = new Usuario({
            nome: 'A',
            telefone: '11900000002'
        });

        await deveLancarErro(() => usuario.criar(), /entre 2 e 100/);
    });

    await teste('Telefone inválido (letras)', async () => {
        const usuario = new Usuario({
            nome: 'Telefone Inválido',
            telefone: 'abc123'
        });

        await deveLancarErro(() => usuario.criar(), /Telefone inválido/);
    });

    await teste('Email inválido', async () => {
        const usuario = new Usuario({
            nome: 'Email Inválido',
            telefone: '11900000003',
            email: 'sem-arroba'
        });

        await deveLancarErro(() => usuario.criar(), /Email inválido/);
    });

    await teste('Telefone duplicado', async () => {
        const usuario1 = new Usuario({
            nome: 'Primeiro',
            telefone: '11955555555'
        });
        await usuario1.criar();

        const usuario2 = new Usuario({
            nome: 'Segundo',
            telefone: '11955555555'
        });

        await deveLancarErro(() => usuario2.criar(), /já cadastrado/);
    });
}

async function testarBuscas() {
    console.log('\n[Buscas]');

    const ana = new Usuario({ nome: 'Ana', telefone: '11911111111', email: 'ana@test.com' });
    const bruno = new Usuario({ nome: 'Bruno', telefone: '11922222222' });
    const carla = new Usuario({ nome: 'Carla', telefone: '11933333333' });

    await ana.criar()
    await bruno.criar();
    await carla.criar();

    /* buscarPorId */

    await teste('buscarPorId id existente', async () => {
        const encontrado = await Usuario.buscarPorId(ana.id);

        assert.ok(encontrado, 'Usuário deve ser encontrado');
        assert.strictEqual(encontrado.nome, 'Ana');
        assert.strictEqual(encontrado.email, 'ana@test.com');
        assert.ok(encontrado instanceof Usuario, 'Deve retornar instância de Usuario');
    });

    await teste('buscarPorId id inexistente', async () => {
        // ObjectId válido mas que não existe no banco
        const idInexistente = '000000000000000000000000';
        const encontrado = await Usuario.buscarPorId(idInexistente);

        assert.strictEqual(encontrado, null);
    });

    await teste('buscarPorId id inválido', async () => {
        await deveLancarErro(() => Usuario.buscarPorId('id-invalido'), /ID inválido/);
    });

    await teste('buscarPorId id null', async () => {
        await deveLancarErro(() => Usuario.buscarPorId(null), /ID/);
    });

    /* buscarPorTelefone */

    await teste('buscarPorTelefone telefone existente', async () => {
        const encontrado = await Usuario.buscarPorTelefone('11922222222');

        assert.ok(encontrado);
        assert.strictEqual(encontrado.nome, 'Bruno');
    });

    await teste('buscarPorTelefone telefone inexistente', async () => {
        const encontrado = await Usuario.buscarPorTelefone('11999999999');
        assert.strictEqual(encontrado, null);
    });

    await teste('buscarPorTelefone telefone vazio', async () => {
        await deveLancarErro(() => Usuario.buscarPorTelefone(''), /telefone/);
    });

    /* buscarPorNome */

    await teste('buscarPorNome busca parcial', async () => {
        const resultados = await Usuario.buscarPorNome('Bru');

        assert.strictEqual(resultados.length, 1);
        assert.strictEqual(resultados[0].nome, 'Bruno');
    });

    await teste('buscarPorNome case-insensitive', async () => {
        const resultados = await Usuario.buscarPorNome('ana');

        assert.ok(resultados.length >= 1);
        assert.ok(resultados.some(u => u.nome === 'Ana'));
    });

    await teste('buscarPorNome nome inexistente', async () => {
        const resultados = await Usuario.buscarPorNome('NomeQueNaoExiste');
        assert.strictEqual(resultados.length, 0);
    });

    /* listarTodos */

    await teste('listarTodos todos os usuários', async () => {
        const todos = await Usuario.listarTodos();

        assert.ok(todos.length >= 3, `Esperava ao menos 3 usuários, recebeu ${todos.length}`);
        assert.ok(todos.every(u => u instanceof Usuario), 'Todos devem ser instâncias de Usuario');
    });
}

async function testarAtualizacao() {
    console.log('\n[Atualização]');

    await teste('Atualizar dados do usuário', async () => {
        const usuario = new Usuario({
            nome: 'Original',
            telefone: '11944444444'
        });
        await usuario.criar();

        usuario.nome = 'Atualizado';
        usuario.email = 'novo@email.com';
        await usuario.atualizar();

        const recarregado = await Usuario.buscarPorId(usuario.id);
        assert.strictEqual(recarregado.nome, 'Atualizado');
        assert.strictEqual(recarregado.email, 'novo@email.com');
    });

    await teste('Atualizar sem id', async () => {
        const usuario = new Usuario({
            nome: 'Sem ID',
            telefone: '11900000099'
        });
        // id é null porque não foi criado

        await deveLancarErro(() => usuario.atualizar(), /ID/);
    });

    await teste('Atualizar com nome inválido', async () => {
        const usuario = new Usuario({
            nome: 'Original2',
            telefone: '11944444445'
        });
        await usuario.criar();

        usuario.nome = '';
        await deveLancarErro(() => usuario.atualizar(), /nome/);
    });

    await teste('Atualizar usuário inexistente', async () => {
        const usuario = new Usuario({
            id: '000000000000000000000001',
            nome: 'Fantasma',
            telefone: '11900000100'
        });

        await deveLancarErro(() => usuario.atualizar(), /não encontrado/);
    });
}

async function testarDelecao() {
    console.log('\n[Deleção]');

    await teste('Deletar usuário existente', async () => {
        const usuario = new Usuario({
            nome: 'Para Deletar',
            telefone: '11966666666'
        });
        await usuario.criar();
        const idSalvo = usuario.id;

        const resultado = await usuario.deletar();
        assert.strictEqual(resultado, true);

        const recarregado = await Usuario.buscarPorId(idSalvo);
        assert.strictEqual(recarregado, null, 'Usuário deveria ter sido removido');
    });

    await teste('Deletar sem id', async () => {
        const usuario = new Usuario({
            nome: 'Sem ID',
            telefone: '11900000200'
        });

        await deveLancarErro(() => usuario.deletar(), /ID/);
    });

    await teste('Deletar usuário inexistente', async () => {
        const usuario = new Usuario({
            id: '000000000000000000000002',
            nome: 'Fantasma',
            telefone: '11900000201'
        });

        await deveLancarErro(() => usuario.deletar(), /não encontrado/);
    });
}

// =================================================================
// EXECUÇÃO PRINCIPAL
// =================================================================

async function executarTestes() {
    console.log('-'.repeat(60));
    console.log('  TESTES DA CLASSE Usuario');
    console.log('-'.repeat(60));

    try {
        // Conecta e limpa coleção antes dos testes
        await Conexao.conectar();
        console.log('\n[Setup] Conectado ao MongoDB. Limpando coleção...');
        await limparColecao();

        // Suítes
        await testarCriacao();
        await testarBuscas();
        await testarAtualizacao();
        await testarDelecao();

        // Limpa após os testes
        console.log('\nLimpando coleção de testes...');
        await limparColecao();
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