import {CommandInteraction, SlashCommandBuilder, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import { getConfig } from "../../maps";
import {channelNameGenerator, getWeather} from "../../display/meteo";
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
		.addBooleanOption((option) => option
			.setName("force-update")
			.setDescription("Force la mise à jour du channel de météo. Staff uniquement.")
			.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		const options = interaction.options as CommandInteractionOptionResolver;
		console.log(getConfig(interaction.guild!.id, "meteo"));
		const lieu = options.getString("lieu") as string ?? getConfig(interaction.guild!.id, "meteo.ville") ?? "Villefranche-sur-mer";
		const name = options.getString("lieu") as string ?? getConfig(interaction.guild!.id, "meteo.name") ?? "Villefranche-sur-mer";
		const embed = await getWeather(lieu, name);
		await interaction.reply({embeds: [embed]});
		if (hasStaffRole(interaction.member as GuildMember, interaction.guild!.id) && options.getBoolean("force-update")) {
			const config = getConfig(interaction.guild!.id, "meteo") as Meteo;
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
		}
	}
};



