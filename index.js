import { Client, GatewayIntentBits } from 'discord.js';

// Inicializa o cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Substitua pelo token do seu bot
const TOKEN = 'SEU_TOKEN_AQUI';

// Evento: Quando o bot estiver pronto
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
});

// Evento: Quando uma mensagem for enviada
client.on('messageCreate', (message) => {
    // Ignorar mensagens de bots
    if (message.author.bot) return;

    // Responde ao comando "!ping"
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

// Faz login com o token do bot
client.login(TOKEN);