import { z } from 'zod';
import { prisma } from "../../lib/prisma";  
import { FastifyInstance } from 'fastify';

export async function createPoll(app: FastifyInstance) {
// cria uma nova rota do tipo POST com nome 'polls'
// async para funcionar através da promise
  app.post('/polls', async (request, reply) => {

    // estrutura esperada no corpo da requisição
    const creatPollBody = z.object({
      title: z.string(),
      options: z.array(z.string()),
    });

    // validação do corpo da requisição
    const { title, options } = creatPollBody.parse(request.body);

    // zod além de validar, retorna um objeto com os valores validados já tipadas

    // promise que cria um novo poll no banco de dados
    // await somente em funções assíncronas
    // await garante que a função só continue a execução quando a promise for resolvida
    const poll = await prisma.poll.create({
      data: {
        title,
        // cria as opções do poll
        options: {
          // createMany pois serão várias opções
          createMany: {
            // mapeia as opções para o formato esperado pelo prisma
            data: options.map((option) => {
              return { title: option }
            })
          } 
        }
      }
    })


    // retorna uma resposta com status 201 e um objeto com o id do poll criado
    return reply.status(201).send({ pollId: poll.id })
    // 201: Created
  })
  
}

