import {CommandInteraction, CommandInteractionOptionResolver, GuildMember, SlashCommandBuilder} from "discord.js";
import {getConfig} from "../../maps";
import {channelNameGenerator, getWeather, todayWeather, weeklyWeather} from "../../display/meteo";
import {hasStaffRole} from "../../utils/data_check";
import {Meteo} from "../../interface";
import {isValidCron} from "cron-validator";

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
					name: "Météo de la journée",
					value: "today"
				},
				{
					name: "Météo de la semaine",
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

		const lieu = options.getString("lieu") as string ?? (config.ville && config.ville.length > 0) ? config.ville : "Villefranche-sur-mer";
		const name = options.getString("lieu") as string ?? (config.name && config.name.length > 0) ? config.name : config.ville;
		
		if (hasStaffRole(interaction.member as GuildMember, interaction.guild!.id) && options.getBoolean("force-update")) {
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
				const embeds = await todayWeather(lieu);
				await interaction.editReply({files: [embeds.images[0]], content: `# Météo d'aujourd'hui\n ${embeds.alert.join("\n")}`});
				await interaction.followUp({files: [embeds.images[1]]});
				break;
			case "week":
				//eslint-disable-next-line no-case-declarations
				const weekBuffer = await weeklyWeather(lieu);
				for (const embed of weekBuffer) {
					await interaction.followUp({files: [embed]});
				}
				break;
			default:
				// eslint-disable-next-line no-case-declarations
				const embed = await getWeather(lieu, name);
				await interaction.editReply({embeds: embed.allEmbeds, content: embed.alert.join("\n")});
				break;
			}
		} else {
			const embed = await getWeather(lieu, name);
			await interaction.reply({embeds: embed.allEmbeds, content: embed.alert.join("\n")});
		}
	}
};



