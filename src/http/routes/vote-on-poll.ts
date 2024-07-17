import { z } from 'zod'; // biblioteca para validação de dados
import { randomUUID } from 'node:crypto';
import { prisma } from "../../lib/prisma";  
import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis';
import { voting } from '../../utils/voting-pub-sub';
//import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient();

export async function voteOnPoll(app: FastifyInstance) {
    // cria uma nova rota do tipo POST para votar uma enquete específica
    // async para funcionar através da promise
    app.post('/polls/:pollId/votes', async (request, reply) => {

        // estrutura esperada no corpo da requisição
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid(),
        });

        // estrutura esperada nos parâmetros da requisição
        const voteOnPollParams = z.object({
            pollId: z.string().uuid(),
        });

        // validação do corpo da requisição
        const { pollOptionId } = voteOnPollBody.parse(request.body);

        // validação dos parâmetros da requisição
        const { pollId } = voteOnPollParams.parse(request.params);

        // verifica se dentro dos cookies já existe uma sessão para o usuário
        let { sessionId } = request.cookies;

        // se o sessionId já existe, verifica se o usuário já votou anteriormente
        if(sessionId){
            // busca no banco de dados se o usuário já votou na enquete anteriormente
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where:{
                    sessionId_pollId:{
                        sessionId,
                        pollId,
                    },
                }
            })

            // se o usuário já votou nessa enquete e o voto atual é diferente do voto anterior
            if(userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId){
                // apagar o voto anterior
                // criar um novo voto

                await prisma.vote.delete({
                    where:{
                        id: userPreviousVoteOnPoll.id,
                    }
                })

                // decrementa em 1 o ranking do voto anterior no Redis após apagar
                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

                voting.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes),
                })

            } else if (userPreviousVoteOnPoll){
                // retorna uma resposta com status 400 e uma mensagem de erro
                return reply.status(400).send({ message: 'Você já votou nessa enquete.' });
            }
        }

        // se não tiver uma sessão, cria uma nova
        if(!sessionId){
            // cria uma nova sessão para o usuário com um ID aleatório
            sessionId = randomUUID();

            reply.setCookie('sessionId', sessionId, {
                path: '/',                  // todas as rotas podem acessar o cookie
                maxAge: 60 * 60 * 24 * 30,  // um mês - tempo de vida do cookie
                signed: true,               // assinatura do cookie, garantindo que o cookie não foi alterado
                httpOnly: true,             // o cookie só pode ser acessado pelo servidor
            });
        }

        // cria estrutura de voto no banco de dados
        await prisma.vote.create({
            data:{
                sessionId, // Assign an empty string if sessionId is undefined
                pollId,          // vem dos parâmetros da requisição
                pollOptionId,    // vem do corpo da requisição
            }
        
        })

        // incrementa em 1 o ranking dessa opção de voto dentro dessa enquete
        // recebe o id da enquete, o valor a ser incrementado e o id da opção de voto
        const votes = await redis.zincrby(pollId, 1, pollOptionId)

        // exporta a função de utils para publicar a mensagem
        // passa como parâmetro o id da enquete e a mensagem
        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes),
        })
       
        return reply.status(201).send();
    }) 
}