import {
	AutocompleteInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	GuildMember,
	SlashCommandBuilder,
	userMention
} from "discord.js";
import {Seuil, STATISTIQUES} from "../interface";
import {rollNeutre} from "../roll";
import {capitalize, displayNEUTRE} from "../display/results";
import {latinize, logInDev} from "../utils";
import {getInteractionArgs} from "../roll/parseArg";

export default {
	data: new SlashCommandBuilder()
		.setName("act")
		.setDescription("Lance 1D20 de jet d'action")
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
			choices = STATISTIQUES.map(stat => capitalize(stat));
		} else if (focused.name === "seuil") {
			choices = Object.keys(Seuil).map(value => capitalize(value.toString()));
		}
		const results = choices.filter(choice => latinize(choice.toLowerCase()).includes(latinize(focused.value.toLowerCase())));
		await interaction.respond(
			results.map(result => ({ name: result, value: result }))
		);
	},

	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const args = getInteractionArgs(interaction, "neutre");
		const result = rollNeutre(args);
		const member = interaction.member as GuildMember;
		
		const embed = displayNEUTRE(args, result, member);
		let msgInfo = "";
		if (!args.fiche) {
			msgInfo = `${userMention(args.user)} n'a pas de personnage ; Utilisation de la valeur par défaut pour ${args.statistiqueName} (10)`;
		}
		await interaction.reply({ embeds: [embed] });
		if (msgInfo) {
			await interaction.followUp({ content: msgInfo});
		}
	}
};

