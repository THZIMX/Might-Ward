const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Emojis personalizados
const emojis = {
  heart: '<:eg_heart:1353597127091294208>',       // Emoji de afeto
  retribuir: '<:icons_heart:1353597437922775082>'  // Emoji para o botão
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abraço')
    .setDescription('Dê um abraço em alguém!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('「Social」O usuário que você quer abraçar')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('usuario');
    if (user.bot) return interaction.editReply({ content: '🤖 Você não pode abraçar bots!' });

    // Gera imagem de abraço
    const response = await fetch('https://api.waifu.pics/sfw/hug');
    const data = await response.json();

    // Embed principal
    const embed = new EmbedBuilder()
      .setTitle(`${emojis.heart} Abraço Recebido!`)
      .setDescription(`${interaction.user} deu um abraço em ${user}! ${emojis.heart}`)
      .setImage(data.url)
      .setColor('#FFC0CB')
      .setTimestamp();

    // Botão para retribuir
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('retribuir_abraço')
        .setLabel('Retribuir Abraço')
        .setEmoji('1353597437922775082') // icons_heart
        .setStyle(ButtonStyle.Primary)
    );

    const message = await interaction.editReply({ embeds: [embed], components: [row] });

    const filter = i => i.customId === 'retribuir_abraço';
    const collector = message.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async i => {
      if (i.user.id !== user.id) {
        return i.reply({
          content: `⛔ Apenas ${user} pode retribuir esse abraço!`,
          ephemeral: true
        });
      }

      const newHug = await fetch('https://api.waifu.pics/sfw/hug').then(res => res.json());

      const returnEmbed = new EmbedBuilder()
        .setTitle(`${emojis.heart} Retribuição de Abraço`)
        .setDescription(`${user} retribuiu o abraço de ${interaction.user}! ${emojis.heart}`)
        .setImage(newHug.url)
        .setColor('#FF69B4')
        .setTimestamp();

      await i.update({ embeds: [returnEmbed], components: [] });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.edit({ components: [] });
      }
    });
  },
};