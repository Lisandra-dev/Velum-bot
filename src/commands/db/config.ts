/**
 * Configure little things on the bot
 * Like prefix 
 */

import {
	channelMention,
	ChannelType,
	CommandInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder
} from "discord.js";
import { setConfig } from "../../maps";

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
			.setName("ticket")
			.setDescription("Permet de définir la category où les tickets seront créés")
			.addChannelOption( (option) => option
				.setName("category")
				.setDescription("Category des tickets")
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildCategory)
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
			const prefix = options.getString("prefix", true);
			setConfig(interaction.guild.id, "prefix", prefix);
			await interaction.reply(`Le prefix est maintenant \`${prefix}\``);
		} else if (subcommand === "staff") {
			const role = options.getRole("role", true);
			setConfig(interaction.guild.id, "staff", role.id);
			await interaction.reply(`Le rôle staff est maintenant ${role.name}`);
		} else if (subcommand === "ticket") {
			const category = options.getChannel("category", true);
			setConfig(interaction.guild.id, "ticket", category.id);
			await interaction.reply(`La catégorie des tickets est maintenant ${channelMention(category.id)}`);
		}
	},
};
