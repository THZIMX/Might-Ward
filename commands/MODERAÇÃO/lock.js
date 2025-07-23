const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('「Moderação」Trava o canal, impedindo que os membros enviem mensagens.'),
  async execute(interaction) {
    // Verifica se o membro tem a permissão de Gerenciar Canais
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }
    try {
      // Define a permissão de enviar mensagens como false para o cargo @everyone
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });
      return interaction.reply('Canal travado com sucesso.');
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Ocorreu um erro ao travar o canal.', ephemeral: true });
    }
  },
};