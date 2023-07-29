/**
 * Configure little things on the bot
 * Like prefix
 */

import * as cron from "cron-validator";
import {
	channelMention,
	ChannelType,
	CommandInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder, PermissionFlagsBits} from "discord.js";
import dedent from "ts-dedent";

import {Meteo} from "../../interface";
import {check, getConfig, push, remove, setConfig} from "../../maps";

export default {
	data: new SlashCommandBuilder()
		.setName("config")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
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
		.addSubcommandGroup((subcommand) => subcommand
			.setName("ticket")
			.setDescription("Permet de définir les paramètres des tickets")
			.addSubcommand((subcommand) => subcommand
				.setName("category")
				.setDescription("Permet de définir la categories où les tickets seront créés")
				.addChannelOption((option) => option
					.setName("category")
					.setDescription("Categories des tickets")
					.setRequired(true)
					.addChannelTypes(ChannelType.GuildCategory)
				)
			)
			.addSubcommand((subcommand) => subcommand
				.setName("transcript")
				.setDescription("Permet de définir le channel où les transcriptions des tickets seront envoyés")
				.addChannelOption((option) => option
					.setName("channel")
					.setDescription("Channel des transcriptions")
					.setRequired(false)
					.addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread)
				)
			)
		)
		.addSubcommandGroup((group) => group
			.setName("meteo")
			.setDescription("Permet de définir les paramètres de la météo")
			.addSubcommand((subcommand) => subcommand
				.setName("main")
				.setDescription("Permet de définir le channel principal où les messages de la météo seront envoyés")
				.addChannelOption((option) => option
					.setName("channel")
					.setDescription("Channel des messages de la météo")
					.setRequired(false)
					.addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread)
				)
				.addStringOption((option) => option
					.setName("ville")
					.setDescription("Ville à surveiller")
					.setRequired(false)
				)
				.addStringOption((option) => option
					.setName("frequence")
					.setDescription("Fréquence des messages de la météo. Merci d'utiliser un format CRON.")
					.setRequired(false)
				)
				.addStringOption((option) => option
					.setName("nom")
					.setDescription("Permet de changer le nom de la ville.")
					.setRequired(false)
				)
			)
			.addSubcommand((subcommand) => subcommand
				.setName("semaine")
				.setDescription("Permet de définir le channel où les messages de la météo de la semaine seront envoyés")
				.addChannelOption((option) => option
					.setName("channel")
					.setDescription("Channel des messages de la météo de la semaine")
					.setRequired(false)
					.addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread)
				)
			)
			.addSubcommand((subcommand) => subcommand
				.setName("jour")
				.setDescription("Permet de définir le channel où les messages de la météo du jour seront envoyés")
				.addChannelOption((option) => option
					.setName("channel")
					.setDescription("Channel des messages de la météo du jour")
					.setRequired(false)
					.addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread)
				)
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
			.setName("autorole")
			.setDescription("Permet de définir les rôles à ajouter ou retirer avec la commande create")
			.addSubcommand((subcommand) => subcommand
				.setName("liste")
				.setDescription("Affiche la liste des rôles qui seront ajoutés ou retirés")
			)
			.addSubcommand((subcommand) => subcommand
				.setName("set")
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
		} else if (subGroup === "meteo") {
			if (subcommand === "main") {
				await setWeather(interaction, options);
				return;
			} else if (subcommand === "semaine") {
				await setWeatherWeekly(options, interaction);
				return;
			} else if (subcommand === "jour") {
				await setWeatherDaily(options, interaction);
				return;
			}
		} else if (subGroup === "ticket") {
			await ticket(interaction, options, subcommand);
			return;
		} else if (subGroup === "autorole") {
			await autorole(interaction, options, subcommand);
			return;
		}
	},
};

async function setWeather(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const channel = options.getChannel("channel", false);
	const ville = options.getString("ville", false) || "Villefranche-sur-mer";
	if (!channel) {
		setConfig(interaction.guild!.id, "meteo.auto", false);
		await interaction.reply("La météo automatique est maintenant désactivée");
		return;
	}
	let freq = options.getString("frequence", false) || "0 0,6,12,18 * * *";
	if (freq && !cron.isValidCron(freq)) {
		await interaction.reply("La fréquence n'est pas au bon format. Merci d'utiliser un format CRON.");
		freq = "0 0,6,12,18 * * *";
	}
	setConfig(interaction.guild!.id, "meteo", {
		auto: true,
		channel: channel!.id,
		ville: ville,
		frequence: freq,
		name: options.getString("nom", false) || ville,
		forecast: {
			weekly: channel!.id,
			daily: channel!.id
		}
	} as Meteo);
	await interaction.reply(`La météo est maintenant activée dans ${channelMention(channel!.id)} pour la ville de ${ville}, pour un CRON de ${freq}.`);
}

async function ticket(interaction: CommandInteraction, options: CommandInteractionOptionResolver, subcommand: string) {
	if (subcommand === "category") {
		const category = options.getChannel("category", true);
		setConfig(interaction.guild!.id, "ticket", category.id);
		await interaction.reply(`La catégorie des tickets est maintenant ${channelMention(category.id)}`);
	}
	if (subcommand === "transcript") {
		const channel = options.getChannel("channel", false);
		if (!channel) {
			//disable transcript
			setConfig(interaction.guild!.id, "transcript", "");
			await interaction.reply("Les transcriptions sont maintenant désactivées");
			return;
		}
		setConfig(interaction.guild!.id, "transcript", channel.id);
		await interaction.reply(`Le channel des transcriptions est maintenant ${channelMention(channel.id)}`);
	}
}

async function autorole(interaction: CommandInteraction, options: CommandInteractionOptionResolver, subcommand: string) {
	if (subcommand === "set") {
		const choices = options.getString("dans", true);
		if (choices === "add") {
			await interaction.deferReply();
			const role = options.getRole("role", true);
			const isRemoved = check(interaction.guild!.id, "role.remove", role.id);
			if (isRemoved) {
				await interaction.editReply(`Le rôle ${role.name} est déjà dans la liste des rôles à retirer. Suppression`);
				remove(interaction.guild!.id, "role.remove", role.id);
			}
			push(interaction.guild!.id, "role.add", role.id);
			await interaction.editReply(`Le rôle ${role.name} sera maintenant ajouté lors de l'utilisation de la commande create`);
		} else if (choices === "remove") {
			await interaction.deferReply();
			const role = options.getRole("role", true);
			const isAdded = check(interaction.guild!.id, "role.add", role.id);
			if (isAdded) {
				await interaction.editReply(`Le rôle ${role.name} est déjà dans la liste des rôles à ajouter. Suppression`);
				remove(interaction.guild!.id, "role.add", role.id);
			}
			push(interaction.guild!.id, "role.remove", role.id);
			await interaction.editReply(`Le rôle ${role.name} sera maintenant retiré lors de l'utilisation de la commande create`);
		}
	} else if (subcommand === "delete") {
		const role = options.getRole("role", true);
		const choices = options.getString("dans", true);
		if (choices === "add") {
			remove(interaction.guild!.id, "role.add", role.id);
			await interaction.reply(`Le rôle ${role.name} ne sera plus ajouté lors de l'utilisation de la commande create`);
		} else if (choices === "remove") {
			remove(interaction.guild!.id, "role.remove", role.id);
			await interaction.reply(`Le rôle ${role.name} ne sera plus retiré lors de l'utilisation de la commande create`);
		}
	} else if (subcommand === "liste") {
		const roleToAdd = getConfig(interaction.guild!.id, "role.add") as string[];
		const roleToRemove = getConfig(interaction.guild!.id, "role.remove") as string[];
		const message = dedent(`
					**Rôles à ajouter**
					- ${roleToAdd.map((id: string) => `<@&${id}>`).join("\n- ")}
					**Rôles à retirer**
					- ${roleToRemove.map((id: string) => `<@&${id}>`).join("\n- ")}
					`);
		await interaction.reply({ content: message, ephemeral: true }); //prevent the bot from pinging everyone
	}
}

async function setWeatherWeekly(options: CommandInteractionOptionResolver, interaction: CommandInteraction) {
	const channel = options.getChannel("channel", false);
	if (!channel) {
		//disable weekly forecast
		setConfig(interaction.guild!.id, "meteo.forecast.weekly", "");
		await interaction.reply("Les prévisions de la semaine sont maintenant désactivées");
		return;
	}
	setConfig(interaction.guild!.id, "meteo.forecast.weekly", channel.id);
	await interaction.reply(`Les prévisions de la semaine sont maintenant activées dans ${channelMention(channel.id)}. Les prévisions de la semaine sont envoyés tous les lundis !`);
}

async function setWeatherDaily(options: CommandInteractionOptionResolver, interaction: CommandInteraction) {
	const channel = options.getChannel("channel", false);
	if (!channel) {
		//disable daily forecast
		setConfig(interaction.guild!.id, "meteo.forecast.daily", "");
		await interaction.reply("Les prévisions du jour sont maintenant désactivées");
		return;
	}
	setConfig(interaction.guild!.id, "meteo.forecast.daily", channel.id);
	await interaction.reply(`Les prévisions du jour sont maintenant activées dans ${channelMention(channel.id)}. Les prévisions du jour sont envoyés tous les jours à minuit !`);
}

