/**
 * Configure little things on the bot
 * Like prefix 
 */

import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { setConfig } from "../maps";

export default {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDescription("Configure le bot")
		.addSubcommand( (subcommand) => subcommand
			.setName("prefix")
			.setDescription("Change le prefix")
			.addStringOption( (option) => option
				.setName("prefix")
				.setDescription("Nouveau prefix")
				.setRequired(true)
			)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const subcommand = options.getSubcommand();
		if (subcommand === "prefix") {
			const prefix = options.getString("prefix");
			if (!prefix) return;
			setConfig(interaction.guild.id, "prefix", prefix);
			await interaction.reply(`Le prefix est maintenant \`${prefix}\``);
		}
	},
};