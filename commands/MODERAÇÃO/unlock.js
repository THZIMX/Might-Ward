const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('「Moderação」Destrava o canal, permitindo que os membros enviem mensagens.'),
  async execute(interaction) {
    // Verifica se o membro tem a permissão de Gerenciar Canais
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }
    try {
      // Restaura a permissão de enviar mensagens para o cargo @everyone
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      });
      return interaction.reply('Canal destravado com sucesso.');
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Ocorreu um erro ao destravar o canal.', ephemeral: true });
    }
  },
};