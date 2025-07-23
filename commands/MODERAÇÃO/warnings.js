const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { pool } = require('../../handlers/db'); // Certifique-se de que esse arquivo exporta o pool corretamente
const emojis = require('../../databases/emojis.json');

// Função para obter emojis personalizados
function getEmoji(name, fallback = '❓') {
    return emojis?.static?.[name] ? `<:${name}:${emojis.static[name]}>` : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ver-avisos')
        .setDescription('「Moderação」Verifica o número de avisos de um membro.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O membro cujo número de avisos você deseja verificar.')
                .setRequired(true)),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({
                    content: `${getEmoji('icons_wrong', '🚫')} Você não tem permissão para usar este comando.`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: false });

            const user = interaction.options.getUser('usuario');
            const userId = user.id;
            const guildId = interaction.guild.id;

            // Consulta o número de avisos
            const [rows] = await pool.query(
                'SELECT quantidade FROM avisos WHERE guild_id = ? AND user_id = ?',
                [guildId, userId]
            );

            const warnings = rows.length > 0 ? rows[0].quantidade : 0;

            await interaction.editReply({
                content: `${getEmoji('icons_warning', '⚠️')} **${user.tag}** possui **${warnings}** aviso(s).`
            });

        } catch (error) {
            console.error('❌ Erro ao executar o comando /ver-avisos:', error);
            await interaction.editReply({
                content: `${getEmoji('icons_wrong', '🚫')} Ocorreu um erro ao executar este comando.`,
                ephemeral: true
            });
        }
    },
};