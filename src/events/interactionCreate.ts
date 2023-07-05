import { AutocompleteInteraction, BaseInteraction, Client } from "discord.js";
import { commands, autoCompleteCmd } from "../commands";

export default (client: Client): void => {
	client.on("interactionCreate", async (interaction: BaseInteraction) => {
		if (interaction.isCommand()) {
			const command = commands.find(
				(cmd) => cmd.data.name === interaction.commandName
			);
			if (!command) return;
			try {
				await command.execute(interaction);
			} catch (error) {
				console.log(error);
				await interaction.channel?.send({
					content: `\`\`\` ${error} \`\`\``,
				});
			}
		} else if (interaction.isAutocomplete()) {
			const interact = interaction as AutocompleteInteraction;
			const auto = autoCompleteCmd.find(
				(cmd) => cmd.data.name === interact.commandName);
			try {
				await auto?.autocomplete(interact);
			}
			catch (error) {
				console.log(error);
			}
		}
	});
};
