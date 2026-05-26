/**
 * ValidacaoWeb.js — Apoio a validacao na camada web
 * 
 * Distincao importante:
 *   - ERRO DE FORMULARIO: o usuario preencheu algo errado (campo vazio,
 *     telefone invalido, telefone duplicado). Deve ser MOSTRADO ao usuario
 *     e o formulario re-renderizado.
 *   - ERRO INESPERADO: falha de banco, bug, indisponibilidade. NAO e culpa
 *     do usuario; deve ir para o tratador de erros.
 */

/**
 * Executa uma lista de checagens de validacao, acumulando TODAS as falhas.
 * Cada checagem e uma funcao que lanca Error quando o dado e invalido.
 *
 * @param {Array<Function>} checagens - funcoes de validacao
 * @returns {string[]} mensagens de erro (vazio se tudo valido)
 */
function coletarErros(checagens) {
    const erros = [];

    for (const checar of checagens) {
        try {
            checar();
        } catch (erro) {
            erros.push(erro.message);
        }
    }

    return erros;
}

// Padroes de mensagem que caracterizam erro causado pelo usuario.
const PADROES_ERRO_FORMULARIO = [
    /obrigat[oó]rio/i,        // "Campo obrigatorio nao preenchido: ..."
    /inv[aá]lido/i,           // "Telefone invalido", "Email invalido", "ID invalido"
    /j[aá] cadastrado/i,      // "Telefone ja cadastrado"
    /deve ter entre/i,        // "Campo 'nome' deve ter entre 2 e 100..."
    /deve ter/i,              // "grupo deve ter pelo menos 2 participantes"
    /participante/i,          // "Usuario ja e participante", "nao e participante"
    /n[aã]o encontrad/i,      // "Conversa nao encontrada", "Participante nao encontrado"
    /duplicad/i,              // "lista de participantes contem IDs duplicados"
    /n[aã]o tem acesso/i,     // autorizacao negada
    /exatamente/i             // "conversa individual deve ter exatamente..."
];

/**
 * Decide se um Error é erro de formulario
 * ou de uma falha inesperada do sistema.
 *
 * @param {Error} erro
 * @returns {boolean} true se for erro de formulario (deve ser exibido)
 */
function ehErroDeFormulario(erro) {
    if (!erro || !erro.message) {
        return false;
    }
    
    return PADROES_ERRO_FORMULARIO.some((padrao) => padrao.test(erro.message));
}

module.exports = { coletarErros, ehErroDeFormulario };