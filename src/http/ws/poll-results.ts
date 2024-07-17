import { FastifyInstance } from "fastify";
import { voting } from "../../utils/voting-pub-sub";
import z from "zod";
import websocket from "@fastify/websocket";

export async function pollResults(app: FastifyInstance){
    app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
        const getPollParams = z.object({
            // busca o ID da enquete
            pollId: z.string().uuid(),
        })
    
        const { pollId } = getPollParams.parse(request.params);

        // se inscreve nessa canal e passa a função que recebe a mensagem
        voting.subscribe( pollId, (message) => {
            // Antes de enviar, verifica se o socket existe e está aberto
            if (connection.socket && connection.socket.readyState === connection.socket.OPEN) {
                connection.socket.send(message);
            } else {
                console.error("WebSocket is not open or is undefined.");
            }
        })
    });     
}

// Pub/Sub - Publish/Subscribe

