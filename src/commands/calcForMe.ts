import {CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("bonus")
		.setDescription("Calcule pour vous le bonus d'une statistique")
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
		const bonus = Math.floor((value - 11) / 2);
		await interaction.reply(`Le bonus de ${value} est de ${bonus}`);
	}
};
