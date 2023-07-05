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
		)
		.addSubcommand( (subcommand) => subcommand
			.setName("staff")
			.setDescription("Permet de définir le rôle staff pour donner le droit de faire des jets de dés pour les autres")
			.addRoleOption( (option) => option
				.setName("role")
				.setDescription("Rôle staff")
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
		} else if (subcommand === "staff") {
			const role = options.getRole("role");
			if (!role) return;
			setConfig(interaction.guild.id, "staff", role.id);
			await interaction.reply(`Le rôle staff est maintenant ${role.name}`);
		}
	},
};
