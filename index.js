import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

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
const canaisPermitidos = [
    '🚓 𝐏𝐓𝐑 ¹',
    '🚓 𝐏𝐓𝐑 ²',
    '🚓 𝐏𝐓𝐑 ³',
    '🚓 𝐏𝐓𝐑 ALFA',
    '🚓 𝐏𝐓𝐑 BRAVO',
    '🚓 𝐏𝐓𝐑 CHARLIE',
    '🚓 𝐏𝐓𝐑 DELTA',
];
const canalBatePonto = '📲・𝐁𝐚𝐭𝐞-𝐏𝐨𝐧𝐭𝐨';
const pontos = {};

// Função para formatar data/hora
function formatarDataHora(data) {
    return data.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

// Função para calcular duração
function calcularDuracao(inicio, fim) {
    const duracao = (fim - inicio) / 1000;
    const horas = Math.floor(duracao / 3600);
    const minutos = Math.floor((duracao % 3600) / 60);
    const segundos = Math.floor(duracao % 60);
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Função para verificar canal permitido
function verificarCanalPermitido(message) {
    if (message.channel.name !== canalBatePonto) {
        message.reply(
            `⛔ Os comandos do bot só podem ser utilizados no canal **${canalBatePonto}**.`
        );
        return false;
    }
    return true;
}

// Função para abrir ponto
function abrirPonto(userId, username, voiceChannel, message) {
    if (!voiceChannel || !canaisPermitidos.includes(voiceChannel.name)) {
        return message.reply(
            '⛔ Você precisa estar conectado a um dos canais permitidos para bater o ponto!'
        );
    }

    if (pontos[userId]?.aberto) {
        return message.reply(
            `⛔ **Ponto já aberto!**\nVocê já tem um ponto aberto, ${username}.\nUse \`!bater\` para finalizar o ponto.`
        );
    }

    pontos[userId] = {
        nome: username,
        inicio: new Date(),
        aberto: true,
    };

    message.reply(
        `📅 **Ponto aberto com sucesso!**\n\n**Usuário:** ${username}\n🕒 **Início:** ${formatarDataHora(
            pontos[userId].inicio
        )}`
    );
}

// Função para fechar ponto
function fecharPonto(userId, username, message) {
    const ponto = pontos[userId];
    if (!ponto?.aberto) {
        return message.reply('⛔ Você não tem nenhum ponto aberto para fechar.');
    }

    const inicio = ponto.inicio;
    const fim = new Date();
    pontos[userId] = {
        ...ponto,
        fim: fim,
        aberto: false,
        duracao: calcularDuracao(inicio, fim),
    };

    message.reply(
        `📅 **Ponto fechado com sucesso!**\n\n**Usuário:** ${username}\n🕒 **Início:** ${formatarDataHora(
            inicio
        )}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${pontos[userId].duracao}`
    );
}

// Função para exibir ponto
function exibirPonto(userId, message) {
    const ponto = pontos[userId];
    if (!ponto) {
        return message.reply('⛔ Você não tem nenhum registro de ponto.');
    }

    const { nome, inicio, fim, duracao, aberto } = ponto;
    const detalhes = aberto
        ? `🕒 **Início:** ${formatarDataHora(inicio)}\n⏳ **Status:** Ponto Aberto`
        : `🕒 **Início:** ${formatarDataHora(inicio)}\n🕒 **Fim:** ${formatarDataHora(
              fim
          )}\n⏳ **Duração:** ${duracao}`;

    message.reply(`📋 **Dados do Ponto de ${nome}:**\n\n${detalhes}`);
}

// Evento de mensagem
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (!verificarCanalPermitido(message)) return;

    const userId = message.author.id;
    const username = message.author.username;
    const guild = message.guild;
    const voiceChannel = guild.members.cache.get(userId)?.voice.channel;

    if (message.content === '!ponto') return abrirPonto(userId, username, voiceChannel, message);

    if (message.content === '!bater') return fecharPonto(userId, username, message);

    if (message.content === '!meuponto') return exibirPonto(userId, message);
});

// Evento de atualização de estado de voz
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = oldState.id;
    const ponto = pontos[userId];

    if (!ponto?.aberto) return;

    const oldChannelName = oldState.channel?.name;
    const newChannelName = newState.channel?.name;

    if (
        oldChannelName &&
        canaisPermitidos.includes(oldChannelName) &&
        (!newChannelName || !canaisPermitidos.includes(newChannelName))
    ) {
        const inicio = ponto.inicio;
        const fim = new Date();
        pontos[userId] = {
            ...ponto,
            fim: fim,
            aberto: false,
            duracao: calcularDuracao(inicio, fim),
        };

        const guild = oldState.guild;
        const batePontoChannel = guild.channels.cache.find(
            (channel) => channel.name === canalBatePonto
        );

        if (batePontoChannel) {
            batePontoChannel.send(
                `📅 **Ponto fechado automaticamente!**\n\n**Usuário:** ${ponto.nome}\n🕒 **Início:** ${formatarDataHora(
                    inicio
                )}\n🕒 **Fim:** ${formatarDataHora(fim)}\n⏳ **Duração:** ${pontos[userId].duracao}`
            );
        }
    }
});

// Login do bot
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
});

client.login(TOKEN);
