import { AutocompleteInteraction, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, User, userMention } from "discord.js";
import { logInDev } from "../utils";
import { DEFAULT_STATISTIQUE, Seuil } from "../interface";
import { getCharacters } from "../maps";

export default {
	data: new SlashCommandBuilder()
		.setName("roll")
		.setDescription("Lance 1D8 de dégât")
		.addStringOption( (option) => option
			.setName("statistique")
			.setDescription("Statistique à utiliser")
			.setRequired(false)
			.setAutocomplete(true)
		)
		.addStringOption((option) => option
			.setName("seuil")
			.setDescription("Seuil à atteindre")
			.setRequired(false)
			.setAutocomplete(true)
		)
		.addStringOption((option) => option
			.setName("name")
			.setDescription("Nom du personnage")
			.setRequired(false)
		)
		.addIntegerOption((option) => option
			.setName("modificateur")
			.setDescription("Bonus ou malus sur le jet")
			.setRequired(false)
		)
		.addStringOption((option) => option
			.setName("commentaire")
			.setDescription("Commentaire sur le jet")
			.setRequired(false)
		),
	async autocomplete(interaction: AutocompleteInteraction) {
		const opt = interaction.options as CommandInteractionOptionResolver;
		const focused = opt.getFocused(true);
		let choices: string[] = [];
		if (focused.name === "statistique") {
			choices = [
				"force",
				"agilité",
				"intelligence",
				"psychologie",
				"perception",
			];
		} else if (focused.name === "seuil") {
			choices = Object.keys(Seuil).map(value => value.toString());
		}
		const results = choices.filter(choice => choice.startsWith(focused.value));
		await interaction.respond(
			results.map(result => ({ name: result, value: result }))
		);
	},

	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const seuil = options.getString("seuil") || "moyen";
		const stat = options.getString("statistique") || "neutre";
		const name = options.getString("name") || "main";
		const modificateur = options.getInteger("modificateur") || 0;
		const commentaire = options.getString("commentaire") || "";
		/** search seuil number */
		const seuilValue = Seuil[seuil as keyof typeof Seuil] ?? parseInt(seuil);
		/** search characters */
		const user = interaction.user as User;
		const guildID = interaction.guild.id;
		let characters = getCharacters(guildID, user.id);
		let msgInfo = "";
		if (!characters) {
			msgInfo = `${userMention(user.id)} n'a pas de personnage ; Utilisation des statistiques par défaut (10)`;
			characters = DEFAULT_STATISTIQUE;
		}
		const roll = Math.floor(Math.random() * 20) + 1;
		const charModif = characters.stats;
		const statModif = charModif[stat as keyof typeof charModif] ?? 10;
		logInDev("statModif", statModif);
		const calcEditByStats = roundUp((statModif - 11)/2) + modificateur;
		logInDev("calcEditByStats", calcEditByStats);
		logInDev("roll", roll);
		logInDev("seuilValue", seuilValue);
		const result = roll + calcEditByStats;
		const resultSuccess = {
			"success" : result >= seuilValue,
			"EC" : result === 1,
			"RC" : result === 20
		};
		let msg = "";
		const userMsg = name === "main" ? userMention(user.id) : `[${name}] (${userMention(user.id)})`;
		if (resultSuccess.EC) {
			msg = `${userMsg} fait un EC !`;
		} else if (resultSuccess.RC) {
			msg = `${userMsg} fait un RC !`;
		} else {
			msg = `${userMsg} fait un ${resultSuccess.success ? "succès" : "échec"} !`;
		}
		msg += `\n#Roll : ${roll} ${calcEditByStats} = ${result}`;
		msg += `\n#Seuil : ${seuilValue}`;
		msg += commentaire ? `\n#Commentaire : ${commentaire}` : "";
		await interaction.reply({ content: msg });
		if (msgInfo) {
			await interaction.followUp({ content: msgInfo, ephemeral: true });
		}
	}
};

function roundUp(num: number): number {
	if (num >= 0) {
		return Math.ceil(num);
	} else {
		return Math.floor(num);
	}
}