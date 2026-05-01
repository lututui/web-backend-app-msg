# Projeto 1 - Mensagens Instantâneas

Biblioteca Node.js de acesso a SGDB para um sistema de mensagens instantâneas, desenvolvida como parte da disciplina **EC48B-C71 - Programação Web Back-End** (UTFPR - Cornélio Procópio).

## Tecnologias

- Node.js (≥ 20.19.0)
- Driver `mongodb` v7.2.0

## Configuração

A aplicação se conecta a `mongodb://localhost:27017` no banco `app_msg_db`.

## Execução

Demonstração:

```bash
npm start
```

Testes:

```bash
npm test
```

## Classes

### Usuario
Representa um usuário do sistema. Armazenado na coleção `usuarios`.

Métodos: `criar`, `buscarPorId`, `buscarPorTelefone`, `buscarPorNome`, `listarTodos`, `atualizar`, `deletar`.

### Conversa
Representa uma conversa individual ou em grupo. Armazenado na coleção `conversas`.

Métodos: `criar`, `buscarPorId`, `listarPorUsuario`, `temParticipante`, `adicionarParticipante`, `removerParticipante`, `atualizar`, `deletar`.

### Mensagem
Representa uma mensagem enviada em uma conversa. Armazenado na coleção `mensagens`.

Métodos: `enviar`, `buscarPorId`, `buscarPorConversa`, `buscarPorIntervalo`, `buscarPorTexto`, `atualizarStatus`, `marcarComoLida`, `deletar`.

## Logs

Diretório `logs/`, arquivos no formato `YYYY-MM-DD.log`
