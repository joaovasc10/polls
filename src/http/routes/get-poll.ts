import { z } from "zod"; // biblioteca para validação de dados
import { prisma } from "../../lib/prisma";
import { FastifyInstance } from "fastify";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
    // cria uma nova rota do tipo GET para buscar uma enquete específica
    // async para funcionar através da promise
    app.get('/polls/:pollId', async (request, reply) => {

        // estrutura esperada nos parâmetros da requisição
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        });

        const { pollId } = getPollParams.parse(request.params);

        // promise que busca um poll no banco de dados
        // findUnique: busca um único registro no banco de dados
        const poll = await prisma.poll.findUnique({
            // encontra uma enquete onde o ID seja igual ao ID passado nos parâmetros (através da URL)
            where:{
                id: pollId,
            },

            include: {
                // inclui as opções da enquete
                options: {
                    select :{
                        // retorna o id e o título das opções
                        id: true,
                        title: true,
                    }
                }
            }
        });

        // se não encontrar a enquete, retorna um erro 404
        if(!poll){
            return reply.status(404).send({ message: 'Poll not found'});
        }

        // retorna o ranking de cada uma das opções da enquete
        const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES');

        // reduce para transformar o array de strings em um objeto que contenha o id da opção e a quantidade de votos daquela opção
        // índice par = ID da opção
        // índice ímpar = score da opção
        const votes = result.reduce((obj, line, index) =>{
            // se o índice for par
            if(index % 2 === 0){
                // pega o ID da opção
                const score = result[index + 1];

                // mescla dois objetos em um só
                Object.assign(obj, {[line]: Number(score)});
            }

            return obj;
        }, {} as Record<string, number>);


        // retorna uma resposta com status 201 e um objeto com o id do poll criado
        // retorna o objeto poll encontrado por completo
        return reply.send({ 
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map((option) => {
                    return {
                        id: option.id,
                        title: option.title,
                        score: (option.id in votes) ? votes[option.id] : 0,
                    };  
                }),
            },
        });
    }) 
}