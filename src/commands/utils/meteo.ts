import { CommandInteraction, SlashCommandBuilder, CommandInteractionOptionResolver } from "discord.js";
import { getConfig } from "../../maps";
import {getWeather} from "../../display/meteo";

export default {
	data: new SlashCommandBuilder()
		.setDMPermission(false)
		.setName("meteo")
		.setDescription("Invoque la météo pour le lieu demandé. Par défaut, utilise le lieu définit par les administrateurs.")
		.addStringOption((option) => option
			.setName("lieu")
			.setDescription("Lieu pour lequel la météo est demandée")
			.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		const options = interaction.options as CommandInteractionOptionResolver;
		console.log(getConfig(interaction.guild!.id, "meteo"));
		const lieu = options.getString("lieu") as string ?? getConfig(interaction.guild!.id, "meteo.ville") ?? "Villefranche-sur-mer";
		const name = options.getString("lieu") as string ?? getConfig(interaction.guild!.id, "meteo.name") ?? "Villefranche-sur-mer";
		const embed = await getWeather(lieu, name);
		await interaction.reply({embeds: [embed]});
	}
};



