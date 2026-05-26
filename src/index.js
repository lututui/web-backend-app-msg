/**
 * Demonstração do projeto
 */

const Conexao = require('./database/Conexao');
const Usuario = require('./classes/Usuario');
const Conversa = require('./classes/Conversa');
const Mensagem = require('./classes/Mensagem');
const Logger = require('./utils/Logger');
const Validador = require('./utils/Validador');

async function demonstracao() {
    try {
        await Conexao.conectar();

        // 1. Criar usuários
        const ana = new Usuario({ nome: 'Ana', telefone: '11911111111' });
        const bruno = new Usuario({ nome: 'Bruno', telefone: '11922222222' });
        await ana.criar();
        await bruno.criar();
        console.log(`Usuários criados: ${ana.nome}, ${bruno.nome}`);

        // 2. Criar conversa
        const conversa = new Conversa({
            tipo: 'individual',
            participantes: [ana.id, bruno.id]
        });
        await conversa.criar();
        console.log(`Conversa criada: ${conversa.id}`);

        // 3. Trocar mensagens
        const msg1 = new Mensagem({
            conversaId: conversa.id,
            remetenteId: ana.id,
            conteudo: 'Olá, Bruno!'
        });
        await msg1.enviar();

        const msg2 = new Mensagem({
            conversaId: conversa.id,
            remetenteId: bruno.id,
            conteudo: 'Oi Ana, tudo bem?'
        });
        await msg2.enviar();

        // 4. Listar mensagens da conversa
        const historico = await Mensagem.buscarPorConversa(conversa.id);
        console.log(`\nHistórico (${historico.length} mensagens):`);
        historico.forEach(m => {
            console.log(`  [${m.timestamp.toLocaleTimeString()}] ${m.conteudo}`);
        });

        // 5. Marcar mensagem como lida
        await msg1.marcarComoLida();
        console.log(`\nMensagem ${msg1.id} marcada como lida.`);

    } catch (erro) {
        console.error('Erro na demonstração:', erro.message);
        Logger.error(erro, 'index.demonstracao');
        process.exitCode = 1;
    } finally {
        await Conexao.desconectar();
    }
}

// Roda a demonstração apenas se o arquivo for executado diretamente
if (require.main === module) {
    demonstracao();
}


module.exports = {
    Conexao,
    Usuario,
    Conversa,
    Mensagem,
    Logger,
    Validador
};