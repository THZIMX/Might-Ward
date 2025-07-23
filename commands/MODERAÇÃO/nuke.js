const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const emojis = require('../../databases/emojis.json'); // Importa o arquivo de emojis

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('「Moderação」Deleta todas as mensagens de um canal e recria o canal.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels), // Corrigido para gerenciar canais

    async execute(interaction) {
        const channel = interaction.channel;
        const user = interaction.user;

        // Verifica se o usuário tem permissão para gerenciar canais
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({
                content: `${emojis.static.icons_Wrong} Apenas usuários com permissão para **Gerenciar Canais** podem usar este comando.`,
                ephemeral: true,
            });
        }

        // Verifica se o bot tem permissão para gerenciar canais e visualizar canais
        const botMember = await interaction.guild.members.fetchMe();
        if (!botMember.permissions.has([PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ViewChannel])) {
            return interaction.reply({
                content: `${emojis.static.icons_Wrong} Eu não tenho permissão para **Gerenciar Canais** ou **Visualizar Canais**. Verifique minhas permissões.`,
                ephemeral: true,
            });
        }

        try {
            // Criação de uma embed para o log
            const embed = new EmbedBuilder()
                .setColor(0xff0000) // Vermelho
                .setTitle('💥 Canal Nukado')
                .setDescription(`🔹 **Canal:** ${channel.name} (\`${channel.id}\`)\n🔹 **Ação realizada por:** ${user.tag} (\`${user.id}\`)`)
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: 'MightWard Bot - Nuke', iconURL: user.displayAvatarURL() })
                .setTimestamp();

            // Clona o canal e mantém as permissões e configurações
            const clonedChannel = await channel.clone({ reason: `Nuke solicitado por ${user.tag}` });

            // Pequeno atraso para evitar erro ao definir a posição
            setTimeout(async () => {
                await clonedChannel.setPosition(channel.position);
            }, 2000);

            // Deleta o canal original
            await channel.delete(`Nuke solicitado por ${user.tag}`);

            // Envia uma mensagem no novo canal
            await clonedChannel.send({ content: `${emojis.static.eg_fire} **Canal limpo com sucesso!**`, embeds: [embed] });

            // Busca o canal de logs pelo ID (se estiver configurado)
            const logChannelID = '123456789012345678'; // Substituir pelo ID real ou buscar no banco de dados
            const logChannel = interaction.guild.channels.cache.get(logChannelID);
            if (logChannel) logChannel.send({ embeds: [embed] });

            // Responde ao usuário de forma oculta
            await interaction.reply({
                content: `${emojis.static.icons_Correct} **O canal foi "nukado" com sucesso!**`,
                ephemeral: true,
            });

        } catch (err) {
            console.error('Erro ao nukar o canal:', err);

            let errorMessage = `${emojis.static.icons_Wrong} **Ocorreu um erro inesperado ao tentar "nukar" o canal.**`;

            if (err.message.includes('Missing Access')) {
                errorMessage = `${emojis.static.icons_Wrong} **Não foi possível "nukar" o canal.** Certifique-se de que meu cargo está acima na hierarquia.`;
            } else if (err.message.includes('Invalid Permissions')) {
                errorMessage = `${emojis.static.icons_Wrong} **Não tenho as permissões necessárias para realizar esta ação.** Verifique se posso **Gerenciar Canais**.`;
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }
    },
};