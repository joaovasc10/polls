// canais de comunicação entre os serviços de votação
// cada enquete terá um canal de comunicação próprio
// os canais são responsáveis por enviar mensagens para os clientes conectados nesse canal
// o VotingPubSub é responsável por gerenciar esses canais
// É UM PATTERN QUE PUBLICA MENSAGEM E TEM FUNÇÕES OUVINDO ESSAS MENSAGENS

// cada vez que uma mensagem é enviada para um canal, todos os clientes conectados a esse canal devem receber essa mensagem
// essa mensagem vai conter sempre o id da opção da enquete que recebeu voto e a quantidade de votos que aquela opção possui
type Message = { pollOptionId: string, votes: number}

type Subscriber = (message: Message) => void;

class VotingPubSub {
    // ao enviar o id da enquete
    private channels: Record<string, Subscriber[]> = {};

    subscribe(pollId: string, subscriber: Subscriber){
        // se o canal não existir
        if(!this.channels[pollId]){
            // cria um novo canal
            this.channels[pollId] = [];
        }

        // adiciona o cliente ao canal
        this.channels[pollId].push(subscriber);
    }

    // publica uma mensagem para todos os clientes conectados ao canal
    publish(pollId: string, message: Message){
        // se o canal não tiver nenhum subscriber
        if(!this.channels[pollId]){
            // não faz nada
            return;
        }

        // percorre cada subscriber do canal e chama a função de callback
        for(const subscriber of this.channels[pollId]){
            // envia a mensagem para o subscriber
            subscriber(message);
        }
    }
}

// exporta uma instância do VotingPubSub
export const voting = new VotingPubSub();