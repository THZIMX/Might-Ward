const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { pool } = require('../../handlers/db'); // Conexão MariaDB
const emojis = require('../../databases/emojis.json');

// Função para obter emojis personalizados
function getEmoji(name, fallback = '❓') {
    return emojis?.static?.[name] ? `<:${name}:${emojis.static[name]}>` : fallback;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aviso')
        .setDescription('「Moderação」Adiciona um aviso a um membro.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O membro a ser avisado.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('O motivo do aviso.')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '🚫')} Você não tem permissão para usar este comando.`,
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
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
                content: `${getEmoji('icons_wrong', '🚫')} Você não pode avisar a si mesmo!`,
                ephemeral: true
            });
        }

        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '🤖')} Eu não posso ser avisado!`,
                ephemeral: true
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: `${getEmoji('icons_wrong', '⚠️')} Você não pode avisar alguém com um cargo igual ou superior ao seu!`,
                ephemeral: true
            });
        }

        try {
            // Verifica se já há aviso
            const [rows] = await pool.query(
                'SELECT quantidade FROM avisos WHERE guild_id = ? AND user_id = ?',
                [guildId, user.id]
            );

            let novaQuantidade = 1;

            if (rows.length > 0) {
                novaQuantidade = rows[0].quantidade + 1;
                await pool.query(
                    'UPDATE avisos SET quantidade = ? WHERE guild_id = ? AND user_id = ?',
                    [novaQuantidade, guildId, user.id]
                );
            } else {
                await pool.query(
                    'INSERT INTO avisos (guild_id, user_id, quantidade) VALUES (?, ?, ?)',
                    [guildId, user.id, novaQuantidade]
                );
            }

            await interaction.reply({
                content: `${getEmoji('icons_exclamation', '⚠️')} **${user.tag}** recebeu um aviso!\n📌 **Motivo:** ${motivo}\n📊 **Total de avisos:** ${novaQuantidade}`
            });

            try {
                await user.send(`⚠️ Você recebeu um aviso no servidor **${interaction.guild.name}**.\n📌 **Motivo:** ${motivo}\n📊 **Total de avisos:** ${novaQuantidade}`);
            } catch {
                console.log(`Não foi possível enviar DM para ${user.tag}.`);
            }

        } catch (error) {
            console.error('❌ Erro ao registrar aviso:', error);
            await interaction.reply({
                content: `${getEmoji('icons_wrong', '❌')} Ocorreu um erro ao registrar o aviso.`,
                ephemeral: true
            });
        }
    },
};