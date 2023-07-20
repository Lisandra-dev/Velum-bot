import { CommandInteraction, SlashCommandBuilder, CommandInteractionOptionResolver } from "discord.js";
import { getConfig } from "src/maps";

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
		const lieu = options.getString("lieu") ?? getConfig(interaction.guild!.id, "meteo.ville") ?? "Villefranche-sur-mer";
		

	}
		
};