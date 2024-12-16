import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

// Configurações do dotenv
dotenv.config();

// Configuração do cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;

// Objeto para armazenar os dados dos pontos
const pontos = {};

// Função para formatar data/hora
function formatarDataHora(data) {
    return data.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

// Evento quando o bot está pronto
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
});

// Evento para lidar com mensagens
client.on('messageCreate', (message) => {
    // Ignorar mensagens de bots
    if (message.author.bot) return;

    // Comando para abrir o ponto
    if (message.content === '!ponto') {
        const userId = message.author.id;

        // Verificar se o ponto já está aberto
        if (pontos[userId]?.aberto) {
            message.reply(
                `⛔ **Ponto já aberto!**\nVocê já tem um ponto aberto, ${message.author.username}.\nUse \`!bater\` para finalizar o ponto.`
            );
            return;
        }

        // Registrar abertura do ponto
        pontos[userId] = {
            nome: message.author.username,
            inicio: new Date(),
            aberto: true,
        };

        message.reply(
            `📅 **Ponto aberto com sucesso!**\n\n**Usuário:** ${message.author.username}\n🕒 **Início:** ${formatarDataHora(pontos[userId].inicio)}`
        );
    }

    // Comando para fechar o ponto
    if (message.content === '!bater') {
        const userId = message.author.id;

        // Verificar se há um ponto aberto
        if (!pontos[userId]?.aberto) {
            message.reply('⛔ Você não tem nenhum ponto aberto para fechar.');
            return;
        }

        // Registrar fechamento do ponto
        const inicio = pontos[userId].inicio;
        const fim = new Date();
        const duracao = (fim - inicio) / 1000; // duração em segundos
        const horas = Math.floor(duracao / 3600);
        const minutos = Math.floor((duracao % 3600) / 60);
        const segundos = Math.floor(duracao % 60);

        pontos[userId] = {
            ...pontos[userId],
            fim: fim,
            aberto: false,
            duracao: `${horas}h ${minutos}m ${segundos}s`,
        };

        message.reply(
            `📅 **Ponto fechado com sucesso!**\n\n**Usuário:** ${message.author.username}\n🕒 **Início:** ${formatarDataHora(inicio)}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${pontos[userId].duracao}`
        );
    }

    // Comando para visualizar os dados do ponto
    if (message.content === '!meuponto') {
        const userId = message.author.id;

        // Verificar se há dados de ponto
        if (!pontos[userId]) {
            message.reply('⛔ Você não tem nenhum registro de ponto.');
            return;
        }

        const { nome, inicio, fim, duracao, aberto } = pontos[userId];

        // Montar mensagem com os dados do ponto
        const detalhes = aberto
            ? `🕒 **Início:** ${formatarDataHora(inicio)}\n⏳ **Status:** Ponto Aberto`
            : `🕒 **Início:** ${formatarDataHora(inicio)}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${duracao}`;

        message.reply(
            `📋 **Dados do Ponto de ${nome}:**\n\n${detalhes}`
        );
    }
});

// Login do bot
client.login(TOKEN);