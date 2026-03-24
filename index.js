require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// CONFIG
const CARGO_MEMBRO = "1472322818372010070";
const CARGO_STAFF = "1472322818350776580";
const CANAL_PAINEL = "1486083438753878016";
const CANAL_LOG = "1486083691586392236";

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_PAINEL);

  const botao = new ButtonBuilder()
    .setCustomId('registro')
    .setLabel('📋 Fazer Registro')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(botao);

  await canal.send({
    content: '🔥 TROPA DA COREIA - RECRUTAMENTO 🔥\nClique no botão para iniciar.',
    components: [row]
  });
});

client.on(Events.InteractionCreate, async interaction => {

  // BOTÃO
  if (interaction.isButton() && interaction.customId === 'registro') {

    const modal = new ModalBuilder()
      .setCustomId('form')
      .setTitle('Registro');

    const nome = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Seu nome')
      .setStyle(TextInputStyle.Short);

    const id = new TextInputBuilder()
      .setCustomId('id')
      .setLabel('Seu ID no jogo')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(id)
    );

    await interaction.showModal(modal);
  }

  // FORM
  if (interaction.isModalSubmit() && interaction.customId === 'form') {

    const nome = interaction.fields.getTextInputValue('nome');
    const id = interaction.fields.getTextInputValue('id');

    const canal = await interaction.guild.channels.create({
      name: `registro-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: CARGO_STAFF, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const aprovar = new ButtonBuilder()
      .setCustomId(`aprovar_${interaction.user.id}`)
      .setLabel('✅ Aprovar')
      .setStyle(ButtonStyle.Success);

    const recusar = new ButtonBuilder()
      .setCustomId(`recusar_${interaction.user.id}`)
      .setLabel('❌ Recusar')
      .setStyle(ButtonStyle.Danger);

    await canal.send({
      content: `📋 NOVO REGISTRO\n\n👤 Nome: ${nome}\n🆔 ID: ${id}`,
      components: [new ActionRowBuilder().addComponents(aprovar, recusar)]
    });

    await interaction.reply({ content: '✅ Enviado para análise!', ephemeral: true });
  }

  // APROVAR / RECUSAR
  if (interaction.isButton()) {

    if (!interaction.member.roles.cache.has(CARGO_STAFF)) {
      return interaction.reply({ content: '❌ Sem permissão', ephemeral: true });
    }

    const userId = interaction.customId.split('_')[1];
    const membro = await interaction.guild.members.fetch(userId);
    const log = await interaction.guild.channels.fetch(CANAL_LOG);

    if (interaction.customId.startsWith('aprovar')) {
      await membro.roles.add(CARGO_MEMBRO);
      await log.send(`✅ ${membro.user.tag} aprovado por ${interaction.user.tag}`);
      await interaction.channel.delete();
    }

    if (interaction.customId.startsWith('recusar')) {
      await log.send(`❌ ${membro.user.tag} recusado por ${interaction.user.tag}`);
      await interaction.channel.delete();
    }
  }

});

// LOGIN
client.login(process.env.TOKEN);
