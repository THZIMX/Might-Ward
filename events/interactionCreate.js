const { Events } = require('discord.js');
const { pool } = require('../handlers/db.js'); // Banco de dados

// Mapa de cooldowns
const cooldowns = new Map();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // 📌 Responde quando o bot é mencionado em componentes
      if (interaction.isMessageComponent() && interaction.message.mentions.has(interaction.client.user)) {
        await interaction.reply({ 
          content: 'Oi, como posso ajudar? Use /ajuda para ver os comandos.',
          ephemeral: true
        });
        return;
      }

      // 🚀 Processar comandos Slash  
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`Comando não encontrado: ${interaction.commandName}`);
          return interaction.reply({ 
            content: '❌ Esse comando não está configurado corretamente.',
            ephemeral: true
          });
        }

        // Cooldown (padrão 3 segundos)
        const cooldownTime = 3000;
        const now = Date.now();
        const userId = interaction.user.id;

        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Map());
        }

        const timestamps = cooldowns.get(command.data.name);

        if (timestamps.has(userId)) {
          const expirationTime = timestamps.get(userId) + cooldownTime;

          if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return interaction.reply({
              content: `Espere **${timeLeft}s** para usar \`/${command.data.name}\` novamente.`,
              ephemeral: true
            });
          }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownTime);

        // Executar o comando normalmente
        await command.execute(interaction, interaction.client);
      }

      // 🎛️ Processar botões  
      if (interaction.isButton()) {
        const buttonHandlers = {
          'verificar_button': require('../events/Verificacao.js')
        };

        const handler = buttonHandlers[interaction.customId];
        if (handler) {
          await handler.execute(interaction, interaction.client);
        }
      }

      // 🔍 Autocomplete
      if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (command && command.autocomplete) {
          await command.autocomplete(interaction, interaction.client);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar a interação:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: '❌ Ocorreu um erro ao processar sua interação.',
          ephemeral: true
        });
      } else {
        await interaction.reply({ 
          content: '❌ Ocorreu um erro ao processar sua interação.',
          ephemeral: true
        });
      }
    }
  }
};