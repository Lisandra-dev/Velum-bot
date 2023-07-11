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
import {getConfig, push, remove, setConfig} from "../../maps";
import dedent from "ts-dedent";

export default {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDMPermission(false)
		.setDescription("Configure le bot")
		.addSubcommand((subcommand) => subcommand
			.setName("prefix")
			.setDescription("Change le prefix")
			.addStringOption((option) => option
				.setName("prefix")
				.setDescription("Nouveau prefix")
				.setRequired(true)
			)
		)
		.addSubcommand((subcommand) => subcommand
			.setName("ticket")
			.setDescription("Permet de définir la category où les tickets seront créés")
			.addChannelOption((option) => option
				.setName("category")
				.setDescription("Category des tickets")
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildCategory)
			)
		)
		.addSubcommand((subcommand) => subcommand
			.setName("staff")
			.setDescription("Permet de définir le rôle staff pour donner le droit de faire des jets de dés pour les autres")
			.addRoleOption((option) => option
				.setName("role")
				.setDescription("Rôle staff")
				.setRequired(true)
			)
		)
		.addSubcommandGroup((subcommand) => subcommand
			.setName("role-player")
			.setDescription("Permet de définir les rôles à ajouter ou retirer avec la commande create")
			.addSubcommand((subcommand) => subcommand
				.setName("liste")
				.setDescription("Affiche la liste des rôles qui seront ajoutés ou retirés")
			)
			.addSubcommand((subcommand) => subcommand
				.setName("adjust")
				.setDescription("Permet d'ajouter ou retirer un rôle")
				.addStringOption((option) => option
					.setName("dans")
					.setDescription("Ajouter ou retirer le role de l'utilisateur")
					.setRequired(true)
					.addChoices(
						{
							name: "Ajouter un rôle", value: "add"
						},
						{
							name: "Retirer un rôle", value: "remove"
						}
					)
				)
				.addRoleOption((option) => option
					.setName("role")
					.setDescription("Rôle à ajouter ou retirer")
					.setRequired(true)
				)
			)
			.addSubcommand((subcommand) => subcommand
				.setName("delete")
				.setDescription("Permet de supprimer un rôle de la configuration")
				.addRoleOption((option) => option
					.setName("role")
					.setDescription("Rôle à supprimer")
					.setRequired(true)
				)
				.addStringOption(
					(option) => option
						.setName("dans")
						.setDescription("Supprime un rôle de la liste des rôles à ajouter ou retirer")
						.setRequired(true)
						.addChoices(
							{
								name: "Liste des ajouts", value: "add"
							},
							{
								name: "Liste des suppressions", value: "remove"
							}
						)
				)
			)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const subcommand = options.getSubcommand();
		const subGroup = options.getSubcommandGroup();
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
		} else if (subGroup === "role-player") {
			if (subcommand === "adjust") {
				const choices = options.getString("dans", true);
				if (choices === "add") {
					await interaction.deferReply();
					const role = options.getRole("role", true);
					const isRemoved = getConfig(interaction.guild.id, "role.remove").includes(role.id);
					if (isRemoved) {
						await interaction.editReply(`Le rôle ${role.name} est déjà dans la liste des rôles à retirer. Suppression`);
						remove(interaction.guild.id, "role.remove", role.id);
					}
					push(interaction.guild.id, "role.add", role.id);
					await interaction.editReply(`Le rôle ${role.name} sera maintenant ajouté lors de l'utilisation de la commande create`);
				} else if (choices === "remove") {
					await interaction.deferReply();
					const role = options.getRole("role", true);
					const isAdded = getConfig(interaction.guild.id, "role.add").includes(role.id);
					if (isAdded) {
						await interaction.editReply(`Le rôle ${role.name} est déjà dans la liste des rôles à ajouter. Suppression`);
						remove(interaction.guild.id, "role.add", role.id);
					}
					push(interaction.guild.id, "role.remove", role.id);
					await interaction.editReply(`Le rôle ${role.name} sera maintenant retiré lors de l'utilisation de la commande create`);
				}
			} else if (subcommand === "delete") {
				const role = options.getRole("role", true);
				const choices = options.getString("dans", true);
				if (choices === "add") {
					remove(interaction.guild.id, "role.add", role.id);
					await interaction.reply(`Le rôle ${role.name} ne sera plus ajouté lors de l'utilisation de la commande create`);
				} else if (choices === "remove") {
					remove(interaction.guild.id, "role.remove", role.id);
					await interaction.reply(`Le rôle ${role.name} ne sera plus retiré lors de l'utilisation de la commande create`);
				}
			} else if (subcommand === "liste") {
				const roleToAdd = getConfig(interaction.guild.id, "role.add");
				const roleToRemove = getConfig(interaction.guild.id, "role.remove");
				const message = dedent(`
					**Rôles à ajouter**
					- ${roleToAdd.map((id: string) => `<@&${id}>`).join("\n- ")}
					**Rôles à retirer**
					- ${roleToRemove.map((id: string) => `<@&${id}>`).join("\n- ")}
					`);
				await interaction.reply({ content: message, ephemeral: true }); //prevent the bot from pinging everyone
			}
		}
	},
};
