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
        GatewayIntentBits.GuildVoiceStates, // Necessário para monitorar canais de voz
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;

// Lista de canais permitidos para ponto
const canaisPermitidos = [
    '🚓 𝐏𝐓𝐑 ¹',
    '🚓 𝐏𝐓𝐑 ²',
    '🚓 𝐏𝐓𝐑 ³',
    '🚓 𝐏𝐓𝐑 ⁴',
    '🚓 𝐏𝐓𝐑 ⁵',
    '🚓 𝐏𝐓𝐑 ⁶',
    '🚓 𝐏𝐓𝐑 DELTA',
    '🚓 𝐏𝐓𝐑 fundadores'
];

// Nome do canal de bate-ponto
const canalBatePonto = '📲・𝐁𝐚𝐭𝐞-𝐏𝐨𝐧𝐭𝐨';

// Objeto para armazenar os dados dos pontos
const pontos = {};

// Função para formatar data/hora
function formatarDataHora(data) {
    return data.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

// Função para validar se a mensagem foi enviada no canal correto
function verificarCanal(message) {
    if (message.channel.name !== canalBatePonto) {
        message.reply(
            `⛔ Os comandos do bot só podem ser utilizados no canal **${canalBatePonto}**.`
        );
        return false;
    }
    return true;
}

// Função para abrir ponto
function abrirPonto(message, userId) {
    const guild = message.guild;
    const voiceState = guild.members.cache.get(userId)?.voice;
    const voiceChannel = voiceState?.channel;

    if (!voiceChannel || !canaisPermitidos.includes(voiceChannel.name)) {
        return message.reply(
            '⛔ Você precisa estar conectado a um dos canais permitidos para bater o ponto!'
        );
    }

    if (pontos[userId]?.aberto) {
        return message.reply(
            `⛔ **Ponto já aberto!**\nVocê já tem um ponto aberto, ${message.author.username}.\nUse \`!fechar\` para finalizar o ponto.`
        );
    }

    pontos[userId] = {
        nome: message.author.username,
        inicio: new Date(),
        aberto: true,
    };

    return message.reply(
        `📅 **Ponto aberto com sucesso!**\n\n**Usuário:** ${message.author.username}\n🕒 **Início:** ${formatarDataHora(pontos[userId].inicio)}`
    );
}

// Função para fechar ponto
function fecharPonto(message, userId) {
    if (!pontos[userId]?.aberto) {
        return message.reply('⛔ Você não tem nenhum ponto aberto para fechar.');
    }

    const inicio = pontos[userId].inicio;
    const fim = new Date();
    const duracao = (fim - inicio) / 1000;
    const horas = Math.floor(duracao / 3600);
    const minutos = Math.floor((duracao % 3600) / 60);
    const segundos = Math.floor(duracao % 60);

    pontos[userId] = {
        ...pontos[userId],
        fim: fim,
        aberto: false,
        duracao: `${horas}h ${minutos}m ${segundos}s`,
    };

    return message.reply(
        `📅 **Ponto fechado com sucesso!**\n\n**Usuário:** ${message.author.username}\n🕒 **Início:** ${formatarDataHora(inicio)}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${pontos[userId].duracao}`
    );
}


// Evento quando o bot está pronto
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
});

// Evento para lidar com mensagens
client.on('messageCreate', (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const userId = message.author.id;

    // Verificar se a mensagem foi enviada no canal correto
    if (!verificarCanal(message)) return;

    if (message.content === '!ponto') {
        abrirPonto(message, userId);
    }

    if (message.content === '!fechar') {
        fecharPonto(message, userId);
    }
});

// Fechar o ponto automaticamente ao sair dos canais permitidos
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = oldState.id;
    const userPoint = pontos[userId];

    if (!userPoint?.aberto) return;

    const oldChannelName = oldState.channel?.name;
    const newChannelName = newState.channel?.name;

    if (
        oldChannelName &&
        canaisPermitidos.includes(oldChannelName) &&
        (!newChannelName || !canaisPermitidos.includes(newChannelName))
    ) {
        const inicio = userPoint.inicio;
        const fim = new Date();
        const duracao = (fim - inicio) / 1000;
        const horas = Math.floor(duracao / 3600);
        const minutos = Math.floor((duracao % 3600) / 60);
        const segundos = Math.floor(duracao % 60);

        pontos[userId] = {
            ...userPoint,
            fim: fim,
            aberto: false,
            duracao: `${horas}h ${minutos}m ${segundos}s`,
        };

        const guild = oldState.guild;
        const batePontoChannel = guild.channels.cache.find(
            (channel) => channel.name === canalBatePonto
        );

        if (batePontoChannel) {
            batePontoChannel.send(
                `📅 **Ponto fechado automaticamente!**\n\n**Usuário:** ${userPoint.nome}\n🕒 **Início:** ${formatarDataHora(inicio)}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${pontos[userId].duracao}`
            );
        }
    }
});

// Login do bot
client.login(TOKEN);
