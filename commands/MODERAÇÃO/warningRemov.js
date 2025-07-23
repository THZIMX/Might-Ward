const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { pool } = require('../../handlers/db'); // Conexão com MariaDB
const emojis = require('../../databases/emojis.json'); // Emojis personalizados

function getEmoji(name, fallback = '❓') {
    return emojis?.static?.[name] ? `<:${name}:${emojis.static[name]}>` : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remover-aviso')
        .setDescription('「Moderação」Remove um aviso de um membro.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O membro do qual deseja remover um aviso.')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '🚫')} Você não tem permissão para usar este comando.`,
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        const guildId = interaction.guild.id;
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '🚫')} O usuário **${user.tag}** não está neste servidor.`,
                ephemeral: true
            });
        }

        if (interaction.user.id === user.id) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '⚠️')} Você não pode remover seus próprios avisos!`,
                ephemeral: true
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '⚠️')} Você não pode remover avisos de alguém com um cargo igual ou superior ao seu!`,
                ephemeral: true
            });
        }

        try {
            const [rows] = await pool.query(
                'SELECT quantidade FROM avisos WHERE guild_id = ? AND user_id = ?',
                [guildId, user.id]
            );

            if (rows.length === 0 || rows[0].quantidade === 0) {
                return interaction.reply({
                    content: `${getEmoji('icons_wrong', '🚫')} **${user.tag}** não tem avisos registrados.`,
                    ephemeral: true
                });
            }

            const novaQtd = Math.max(rows[0].quantidade - 1, 0);

            if (novaQtd === 0) {
                await pool.query(
                    'DELETE FROM avisos WHERE guild_id = ? AND user_id = ?',
                    [guildId, user.id]
                );
            } else {
                await pool.query(
                    'UPDATE avisos SET quantidade = ? WHERE guild_id = ? AND user_id = ?',
                    [novaQtd, guildId, user.id]
                );
            }

            await interaction.reply({
                content: `${getEmoji('icons_correct', '✅')} Um aviso foi removido de **${user.tag}**!\n📊 **Total de avisos restantes:** ${novaQtd}`
            });

            try {
                await user.send(`🛠️ Seu aviso foi removido no servidor **${interaction.guild.name}**.\n📊 **Total de avisos restantes:** ${novaQtd}`);
            } catch {
                console.log(`Não foi possível enviar DM para ${user.tag}`);
            }

        } catch (err) {
            console.error('❌ Erro ao remover aviso:', err);
            await interaction.reply({
                content: `${getEmoji('icons_wrong', '❌')} Ocorreu um erro ao remover o aviso.`,
                ephemeral: true
            });
        }
    }
};