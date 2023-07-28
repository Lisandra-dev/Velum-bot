import {isValidCron} from "cron-validator";
import {
	channelMention,
	CommandInteraction,
	CommandInteractionOptionResolver,
	GuildMember,
	SlashCommandBuilder,
	TextChannel} from "discord.js";

import {Meteo} from "../../interface";
import {getConfig} from "../../maps";
import {hasStaffRole} from "../../utils/data_check";
import {channelNameGenerator, createWeatherAsEmbed, generateTodayImage, generateWeeklyImage} from "../../weather/display";

export default {
	data: new SlashCommandBuilder()
		.setDMPermission(false)
		.setName("meteo")
		.setDescription("Invoque la météo pour le lieu demandé. Par défaut, utilise le lieu définit par les administrateurs.")
		.addStringOption((option) => option
			.setName("lieu")
			.setDescription("Lieu pour lequel la météo est demandée")
			.setRequired(false)
		)
		.addStringOption((option) => option
			.setName("forecast")
			.setDescription("Permet d'afficher la météo prévu pour la journée ou la semaine.")
			.addChoices(
				{
					name: "Journée",
					value: "today"
				},
				{
					name: "Semaine",
					value: "week"
				})
			
			.setRequired(false)
		)
		.addBooleanOption((option) => option
			.setName("force-update")
			.setDescription("Force la mise à jour du channel de météo. Staff uniquement.")
			.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		const options = interaction.options as CommandInteractionOptionResolver;
		const config = getConfig(interaction.guild!.id, "meteo") as Meteo;

		const {name, lieu} = getLieuName(options, config);
		if (hasStaffRole(interaction.member as GuildMember, interaction.guild!.id) && options.getBoolean("force-update") && !options.getString("forecast")) {
			if (!config.auto || !isValidCron(config.frequence) || config.channel.length === 0 || config.ville.length === 0) {
				await interaction.followUp("La configuration de la météo n'est pas valide.");
				return;
			}
			const channel = interaction.guild!.channels.cache.get(config.channel);
			
			if (!channel) {
				await interaction.followUp("Le channel de la météo n'existe pas.");
				return;
			}
			const name = await channelNameGenerator(config.ville);
			await channel.setName(name);
			
		} else if (options.getString("forecast")) {
			await interaction.deferReply();
			const moment = options.getString("forecast", true);
			switch (moment) {
			case "today":
				// eslint-disable-next-line no-case-declarations
				const embeds = await generateTodayImage(lieu);
				if (!options.getBoolean("force-update")) {
					await interaction.editReply({files: [embeds.images[0]], content: `# Météo d'aujourd'hui\n ${embeds.alert.join("\n")}`});
					await interaction.followUp({files: [embeds.images[1]]});
				} else {
					const channel = interaction.guild!.channels.cache.get(config.channel)  as TextChannel ?? interaction.channel as TextChannel;
					const dayChannel = interaction.guild!.channels.cache.get(config.forecast.daily) as TextChannel ?? channel;
					await dayChannel.send({files: [embeds.images[0]], content: `# Météo d'aujourd'hui\n ${embeds.alert.join("\n")}`});
					await dayChannel.send({files: [embeds.images[1]]});
					await interaction.followUp(`Météo d'aujourd'hui envoyée dans ${channelMention(dayChannel.id)}.`);
				}
				break;
			case "week":
				//eslint-disable-next-line no-case-declarations
				const weekBuffer = await generateWeeklyImage(lieu);
				if (!options.getBoolean("force-update")) {
					for (const embed of weekBuffer) {
						await interaction.followUp({files: [embed]});
					}
				} else {
					const channel = interaction.guild!.channels.cache.get(config.channel)  as TextChannel ?? interaction.channel as TextChannel;
					const weekChannel = interaction.guild!.channels.cache.get(config.forecast.weekly) as TextChannel ?? channel;
					await weekChannel.send("# Météo de la semaine");
					for (const embed of weekBuffer) {
						await weekChannel.send({files: [embed]});
					}
					await interaction.followUp(`Météo de la semaine envoyée dans ${channelMention(weekChannel.id)}.`);
				}
				break;
			default:
				// eslint-disable-next-line no-case-declarations
				const embed = await createWeatherAsEmbed(lieu);
				// eslint-disable-next-line no-case-declarations
				const content = `## Météo de ${name}\n${embed.alert.join("\n")}`;
				await interaction.editReply({embeds: embed.allEmbeds, content: content});
				break;
			}
		} else {
			const embed = await createWeatherAsEmbed(lieu);
			const content = `## Météo de ${name}\n${embed.alert.join("\n")}`;
			await interaction.reply({embeds: embed.allEmbeds, content: content});
		}
	}
};



function getLieuName(options: CommandInteractionOptionResolver, config: Meteo) {
	if (options.getString("lieu")) {
		return {
			name: options.getString("lieu", true),
			lieu: options.getString("lieu", true)
		};
	}
	let lieu = "Villefranche-Sur-Mer";
	let name = "villefranche-Sur-Mer";
	if (config.ville.length > 0) {
		lieu = config.ville;
	}
	if (config.name.length>0) {
		name = config.name;
	}
	return {
		name: name,
		lieu: lieu
	};
}
