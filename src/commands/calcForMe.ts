import {CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder} from "discord.js";
import {roundUp} from "../utils";

export default {
	data: new SlashCommandBuilder()
		.setName("stat")
		.setDescription("Calcule pour vous la valeur apportée par une statistique")
		.addIntegerOption((option) =>
			option
				.setName("valeur")
				.setDescription("Valeur de la statistique")
				.setRequired(true)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const option = interaction.options as CommandInteractionOptionResolver;
		const value = option.getInteger("valeur");
		if (value === null) return;
		const bonus = roundUp((value - 11) / 2);
		if (bonus < 0) await interaction.reply(`Le malus de ${value} est \`${bonus}\``);
		else await interaction.reply(`Le bonus de ${value} est \`${bonus}\``);
	}
};
