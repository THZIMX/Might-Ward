const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Categorias de comandos
const commandFolders = [
    { name: 'MODERAÇÃO', label: 'Moderação', emoji: '<:eg_modadmin:1353597097076588617>' },
    { name: 'ADMINISTRAÇÃO', label: 'Administração', emoji: '<:eg_modadmin:1353597141569769555>' },
    { name: 'UTILIDADES', label: 'Utilidades', emoji: '<:eg_tools:1353597168912437341>' },
    { name: 'DIVERSÃO', label: 'Diversão', emoji: '<:icons_tada:1353597708371497010>' },
    { name: 'SOCIAL', label: 'Social', emoji: '<:eg_heart:1353597127091294208>' }
];

const categoryColors = {
    'MODERAÇÃO': 'White',
    'ADMINISTRAÇÃO': 'Purple',
    'UTILIDADES': 'Blue',
    'DIVERSÃO': 'Green',
    'SOCIAL': 'Orange',
};

// Carrega comandos formatados de uma pasta
function carregarComandosFormatados(folderPath) {
    const comandos = [];
    const arquivos = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    for (const file of arquivos) {
        const filePath = path.join(folderPath, file);

        try {
            const comando = require(filePath);
            if (comando?.data?.name && comando?.data?.description) {
                comandos.push(`**/${comando.data.name}**\n${comando.data.description}\n`);
            }
        } catch (err) {
            console.warn(`Erro ao carregar comando ${file}:`, err);
        }
    }

    return comandos;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('「Utilidades」Exibe a lista de comandos organizados por categoria.'),

    async execute(interaction) {
        try {
            const options = [];
            const embedsMap = new Map();

            // Prepara embeds e opções do menu
            for (const folder of commandFolders) {
                const folderPath = path.join(__dirname, '..', '..', 'commands', folder.name);
                if (!fs.existsSync(folderPath)) continue;

                const comandos = carregarComandosFormatados(folderPath);
                if (comandos.length === 0) continue;

                const embed = new EmbedBuilder()
                    .setTitle(`${folder.emoji} Comandos de ${folder.label}`)
                    .setDescription(comandos.join('\n').trim())
                    .setColor(categoryColors[folder.name] || 'Blue');

                embedsMap.set(folder.name, embed);

                options.push({
                    label: folder.label,
                    value: folder.name,
                    emoji: folder.emoji
                });
            }

            if (options.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('<:eg_cross:1353597108640415754> Nenhum comando encontrado.')
                    ],
                    ephemeral: true
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ajuda_categoria')
                .setPlaceholder('Selecione uma categoria...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                embeds: [embedsMap.get(options[0].value)],
                components: [row],
                ephemeral: true
            });

            // Coletor de seleção
            const collector = interaction.channel.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: '<:eg_cross:1353597108640415754> Apenas quem usou o comando pode interagir.',
                        ephemeral: true
                    });
                }

                const categoria = i.values[0];
                const embed = embedsMap.get(categoria);

                await i.update({ embeds: [embed], components: [row] });
            });

            collector.on('end', async (_, reason) => {
                if (reason === 'time') {
                    try {
                        await interaction.editReply({ components: [] });
                    } catch (e) {}
                }
            });

        } catch (error) {
            console.error('Erro ao executar o comando /ajuda:', error);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:eg_cross:1353597108640415754> Ocorreu um erro ao carregar os comandos.')
                ],
                ephemeral: true
            });
        }
    }
};