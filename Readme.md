# Projeto 2 - app-msg (Mensagens Instantâneas)

Aplicação web de mensagens instantâneas desenvolvida com **Node.js** e **Express.js**, como parte da disciplina **EC48B-C71 - Programação Web Back-End (UTFPR - Cornélio Procópio)**.

Reusa as classes do Projeto 1 (`Usuario`, `Conversa`, `Mensagem`) como camada de domínio e adiciona ao redor a aplicação web: rotas, sessões, autenticação, validação e renderização de views.

## Tecnologias

"express": "^5.2.1",
    "hbs": "^4.2.1",
    "mongodb": "^7.2.0",
    "express-session": "^1.19.0"

- **Node.js** (≥ 20.19.0)
- **Express.js** (≥ 5.2.1)
- **express-session** (≥ 1.19.0) - sessões de usuário
- **hbs** (≥ 4.2.1) - motor de templates Handlebars
- **MongoDB** (≥7.2.0) - driver `mongodb`

## Pré-requisitos

- Node.js ≥ 20.19.0
- MongoDB rodando em `mongodb://localhost:27017`

A aplicação cria/usa o banco `app_msg_db` automaticamente na primeira inicialização.

## Como rodar

```bash
npm install
npm start
```

O servidor sobe em `http://localhost:3000`. Acesse no navegador.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor web (Projeto 2) |
| `npm run demo` | Roda a demonstração das classes (Projeto 1) |
| `npm test` | Executa os testes das classes do (Projeto 1) |

## Funcionalidades

- Cadastro e login de usuário
- Sessões persistidas em cookie HTTP-only
- Conversas individuais e em grupo
- Envio, exclusão e marcação de mensagens como lida
- Busca de mensagens por texto dentro da conversa
- Gerenciamento de membros do grupo (adicionar, remover)
- Busca de usuários por nome
- Edição de perfil
- Mensagens chegam sem recarregar a página (polling a cada 4s via API JSON)
- Tratamento de erros 404/500 com páginas dedicadas
- Autorização por recurso

---

## Estrutura

```
src/
├── App.js                # Configuração do Express
├── Server.js             # Ponto de entrada (conecta ao Mongo e sobe HTTP)
├── index.js              # Demo do Projeto 1
├── auth/
│   └── Senha.js          # Hash e verificação de senha
├── classes/              # Camada de domínio
│   ├── Usuario.js
│   ├── Conversa.js
│   └── Mensagem.js
├── config/
│   └── Sessao.js         # Configuração do express-session
├── controllers/          # Lógica das rotas
│   ├── Autenticacao.controller.js
│   ├── Conversas.controller.js
│   ├── Mensagens.controller.js
│   ├── MensagensApi.controller.js
│   └── Perfil.controller.js
├── database/
│   └── Conexao.js        # Singleton de conexão com MongoDB
├── middlewares/
│   ├── Autenticacao.js   # Usuário da sessão
│   ├── Autorizacao.js    # Helper de autorização por recurso
│   ├── AsyncHandler.js   # Captura erros em controllers
│   ├── Erros.js          # Handlers 404 e 500
│   └── Flash.js          # Mensagens temporárias
├── routes/               # Definição dos caminhos HTTP
│   ├── Autenticacao.routes.js
│   ├── Conversas.routes.js
│   ├── Mensagens.routes.js
│   ├── MensagensApi.routes.js
│   ├── Perfil.routes.js
│   └── index.js
├── utils/
│   ├── Logger.js          # Logger (Projeto 1)
│   ├── ResolvedorNomes.js # Cache de nomes de usuário
│   ├── ValidacaoWeb.js   # Acumulação de erros + classificação
│   └── Validador.js      # Validador (Projeto 1)
└── views/                # Templates Handlebars
    ├── autenticacao/
    ├── conversas/
    ├── erros/
    ├── partials/
    └── perfil/
public/
└── estilo.css            # CSS da aplicação
tests/                    # Testes das classes (Projeto 1)
```

## Mapa de rotas

### Páginas (HTML)

| Método | Caminho | Função |
|---|---|---|
| GET | `/` | Redireciona conforme o estado de login |
| GET / POST | `/cadastro` | Cadastro de usuário |
| GET / POST | `/login` | Login |
| POST | `/logout` | Encerra a sessão |
| GET | `/conversas` | Lista as conversas do usuário |
| GET | `/conversas/nova` | Formulário de nova conversa individual |
| GET | `/conversas/grupo` | Formulário de novo grupo |
| POST | `/conversas` | Cria conversa (individual ou grupo) |
| GET | `/conversas/:id` | Abre a conversa + histórico |
| GET | `/conversas/:id/buscar` | Busca mensagens (query `?q=`) |
| GET | `/conversas/:id/membros` | Gestão de participantes (grupos) |
| POST | `/conversas/:id/mensagens` | Envia mensagem |
| POST | `/conversas/:id/participantes` | Adiciona participante |
| POST | `/conversas/:id/participantes/remover` | Remove participante |
| POST | `/conversas/:id/excluir` | Exclui a conversa |
| POST | `/mensagens/:id/lida` | Marca como lida (individual) |
| POST | `/mensagens/:id/excluir` | Exclui mensagem |
| GET / POST | `/perfil` | Edição do próprio perfil |
| GET | `/usuarios/buscar` | Busca usuários por nome (`?q=`) |

### API (JSON)

| Método | Caminho | Função |
|---|---|---|
| GET | `/api/conversas/:id/mensagens` | Mensagens da conversa (usada pelo polling) |

---

## Decisões de projeto

- **Camada de domínio reusada.** As classes do Projeto 1 entram como estão, apenas `Usuario` foi estendida para suportar `senhaHash`/`senhaSalt`.
- **Sessões** (`express-session`). Expiração de 2h.

## Testes

Para testar a aplicação web, ver o documento [`ROTEIRO_TESTES.md`](./ROTEIRO_TESTES.md), contendo um roteiro de testes sugerido.

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
