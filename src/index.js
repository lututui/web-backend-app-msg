const Conexao = require('./database/Conexao');
const Logger = require('./utils/Logger');

async function testarConexao() {
    console.log('=== Teste de Conexão com MongoDB ===\n');

    try {
        console.log('[1/3] Conectando ao MongoDB');
        await Conexao.conectar();

        console.log('[2/3] Verificando se a conexão está ativa (ping)...');
        const ativa = await Conexao.estaAtiva();
        
        if (!ativa) {
            throw new Error('A conexão com o MongoDB não está ativa.');
        }

        console.log('[3/3] Listando coleções do banco...');
        const db = Conexao.getDB();
        const colecoes = await db.listCollections().toArray();

        console.log(colecoes);

        console.log('=== Teste concluído com sucesso ===');
    } catch (erro) {
        console.error('\n✗ ERRO durante o teste:');
        console.error(`  ${erro.message}\n`);
        Logger.error(erro, 'index.testarConexao');
        process.exitCode = 1;
    } finally {
        try {
            await Conexao.desconectar();
            console.log('\nConexão encerrada.');
        } catch (erro) {
            console.error(`Erro ao desconectar: ${erro.message}`);
        }
    }
}

testarConexao();