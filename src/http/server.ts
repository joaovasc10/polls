import fastify from "fastify";
import cookie from "@fastify/cookie";
import fastifyWebsocket from "@fastify/websocket";
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import { pollResults } from "./ws/poll-results";

require('dotenv').config();
console.log(process.env.DATABASE_URL);

// MÉTODOS HTTP:
// GET: Buscar uma ou mais informações do servidor
// POST: Criar uma nova informação no servidor
// PUT: Atualizar uma informação no servidor
// DELETE: Remover uma informação do servidor
// PATCH: Atualizar uma informação específica
// HEAD: Buscar informações do servidor sem retornar o corpo da requisição
// OPTIONS: Buscar informações sobre o servidor

const app = fastify();

app.register(cookie, {
  secret: "polls-app-nlw", // for cookies signature
  hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest'  , 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
});

app.register(fastifyWebsocket); // registra o plugin de websocket

// registra a rota de criação de enquetes
app.register(createPoll);

// registra a rota de busca de enquetes
app.register(getPoll);

// registra a rota de votação em enquetes
app.register(voteOnPoll);

app.register(pollResults);

app.listen({port: 3333}).then(() => {
  console.log("Server is running on port 3333");
});