/**
 * Server.js — Servidor da aplicacao web
 *
 *   1. Conecta ao MongoDB.
 *   2. Sobe o servidor HTTP.
 */

const app = require('./App');
const Conexao = require('./database/Conexao');
const Logger = require('./utils/Logger');

// Porta
const PORT = process.env.PORT || 3000;

// Ref servidor HTTP
let servidor = null;

/**
 * Inicializa a aplicacao
 * 
 * Conecta ao banco e sobe o servidor HTTP.
 */
async function iniciar() {
    try {
        await Conexao.conectar();

        servidor = app.listen(PORT, () => {
            Logger.info(
                `Servidor ouvindo na porta ${PORT}`,
                'server.iniciar'
            );
            console.log(`Servidor disponivel em http://localhost:${PORT}`);
        });
    } catch (erro) {
        // Falha na conexao

        Logger.error(erro, 'server.iniciar');
        process.exit(1);
    }
}

/**
 * Encerra a aplicacao.
 * 
 * @param {string} sinal - sinal que disparou o encerramento
 */
async function encerrar(sinal) {
    try {
        // Parar o servidor
        if (servidor) {
            await new Promise((resolve) => servidor.close(resolve));
        }

        // Fechar a conexao com o MongoDB.
        await Conexao.desconectar();

        Logger.info('Aplicacao encerrada.', 'server.encerrar');
        process.exit(0);
    } catch (erro) {
        Logger.error(erro, 'server.encerrar');
        process.exit(1);
    }
}

// Encerrar em Ctrl+C
process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));

iniciar();