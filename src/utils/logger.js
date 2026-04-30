/**
 * Módulo de logging do sistema
 * 
 * Os logs são gravados em /logs com nome baseado na data atual (YYYY-MM-DD.log).
 */

const fs = require('fs');
const path = require('path');

// Diretório onde os arquivos de log serão armazenados
// ROOT_PROJETO/logs
const DIR_LOGS = path.join(__dirname, '..', '..', 'logs');

// Níveis/tipos de log disponíveis
const NIVEIS = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
};

class Logger {
    /**
     * Garante que o diretório de logs existe
     * @private
     */
    static _garantirDiretorio() {
        try {
            if (!fs.existsSync(DIR_LOGS)) {
                fs.mkdirSync(DIR_LOGS, { recursive: true });
            }
        } catch (erro) {
            console.error(`[Logger] Falha ao criar diretório de logs: ${erro.message}`);
            throw erro;
        }
    }

    /**
     * Retorna o timestamp atual no formato YYYY-MM-DD HH:mm:ss
     * @returns {string} timestamp formatado
     * @private
     */
    static _timestamp() {
        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        const seg = String(agora.getSeconds()).padStart(2, '0');

        return `${ano}-${mes}-${dia} ${hora}:${min}:${seg}`;
    }

    /**
     * Retorna o nome do arquivo de log com base na data atual (YYYY-MM-DD.log)
     * @returns {string} caminho completo do arquivo de log
     * @private
     */
    static _arquivoLog() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');

        // ROOT_PROJETO/logs/YYYY-MM-DD.log
        return path.join(DIR_LOGS, `${ano}-${mes}-${dia}.log`);
    }

    /**
     * Formata a entrada de log com timestamp, nível e origem
     * @param {string} nivel - nível do log (INFO, WARNING, ERROR)
     * @param {string} mensagem - mensagem a ser formatada
     * @param {string} origem - classe/método que originou o log
     * @returns {string} entrada formatada
     */
    static formatarLog(nivel, mensagem, origem) {
        const timestamp = Logger._timestamp();
        const origemFormatada = origem ? ` [${origem}]` : '';

        // [YYYY-MM-DD HH:mm:ss] [NIVEL] [Classe.metodo] Mensagem
        return `[${timestamp}] [${nivel}]${origemFormatada} ${mensagem}`;
    }

    /**
     * Grava uma entrada no arquivo de log do dia
     * @param {string} mensagem - entrada formatada do log
     */
    static gravarArquivo(mensagem) {
        try {
            Logger._garantirDiretorio();
            
            fs.appendFileSync(Logger._arquivoLog(), mensagem + '\n', 'utf8');
        } catch (erro) {
            console.error(`[Logger] Falha ao gravar log: ${erro.message}`);
            console.error(mensagem);
        }
    }

    /**
     * Registra uma mensagem de informação
     * @param {string} mensagem - mensagem a ser registrada
     * @param {string} origem - classe/método que originou o log
     */
    static info(mensagem, origem = '') {
        const entrada = Logger.formatarLog(NIVEIS.INFO, mensagem, origem);
        Logger.gravarArquivo(entrada);
    }

    /**
     * Registra uma mensagem de aviso
     * @param {string} mensagem - mensagem a ser registrada
     * @param {string} origem - classe/método que originou o log
     */
    static warning(mensagem, origem = '') {
        const entrada = Logger.formatarLog(NIVEIS.WARNING, mensagem, origem);
        Logger.gravarArquivo(entrada);
    }

    /**
     * Registra uma exceção/erro
     * @param {Error|string} erro - objeto de erro capturado ou mensagem
     * @param {string} origem - classe/método que originou o log
     */
    static error(erro, origem = '') {
        let mensagem;

        if (erro instanceof Error) {
            mensagem = `${erro.name}: ${erro.message}`;
            
            if (erro.stack) {
                mensagem += `\n${erro.stack}`;
            }
        } else {
            mensagem = String(erro);
        }

        const entrada = Logger.formatarLog(NIVEIS.ERROR, mensagem, origem);
        Logger.gravarArquivo(entrada);
    }
}

module.exports = Logger;