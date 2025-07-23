const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gerenciar_usuário')
    .setDescription('「Moderação」Gerencie um usuário com ações como castigo, expulsão ou banimento.')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('O usuário que será gerenciado.')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Permissões necessárias
    const permissoes = [
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers
    ];

    if (!interaction.member.permissions.has(permissoes)) {
      const noPermsEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('<:eg_cross:1353597108640415754> Permissão negada')
        .setDescription(
          'Você precisa de uma das seguintes permissões para usar este comando:\n' +
          '- `Administrador`\n' +
          '- `Expulsar Membros`\n' +
          '- `Banir Membros`'
        );
      return interaction.reply({ embeds: [noPermsEmbed], ephemeral: true });
    }

    const target = interaction.options.getUser('usuário');

    // Embed de gerenciamento
    const embed = new EmbedBuilder()
      .setTitle('<:eg_modadmin:1353597141569769555> Gerenciar Usuário')
      .setDescription(`Escolha uma ação para gerenciar o membro <@${target.id}>:`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor('#5865F2')
      .addFields(
        {
          name: '<:icons_timeout:1353597403986526270> Castigo',
          value: 'Aplique um castigo temporário ao membro.',
          inline: false
        },
        {
          name: '<:icons_kick:1353597294854930432> Expulsar',
          value: 'Remove o membro do servidor.',
          inline: false
        },
        {
          name: '<:icons_ban:1353597206992523380> Banir',
          value: 'Bane permanentemente o membro do servidor.',
          inline: false
        }
      );

    // Botões de ação
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`adminAction_castigo_${target.id}`)
        .setLabel('Aplicar Castigo')
        .setEmoji('1353597403986526270') // <:icons_timeout:...>
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`adminAction_expulsao_${target.id}`)
        .setLabel('Expulsar')
        .setEmoji('1353597294854930432') // <:icons_kick:...>
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`adminAction_banimento_${target.id}`)
        .setLabel('Banir')
        .setEmoji('1353597206992523380') // <:icons_ban:...>
        .setStyle(ButtonStyle.Danger)
    );

    // Envia resposta
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};