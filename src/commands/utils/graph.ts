import {
	AttachmentBuilder,
	AutocompleteInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder, User
} from "discord.js";
import parse from "parse-color";

import {Statistiques} from "../../interface";
import {get} from "../../maps";
import {capitalize, latinise} from "../../utils";
import {imageChar, imagePersonalized} from "../../utils/graph";

export default {
	data: new SlashCommandBuilder()
		.setName("graph")
		.setDescription("Génère un graphique")
		.addSubcommand((subcommand) => subcommand
			.setName("chara")
			.setDescription("Génère un graphique pour un personnage validé")
			.addUserOption((option) => option
				.setName("user")
				.setDescription("Utilisateur à qui dessiner le graphique")
				.setRequired(false)
			)
			.addStringOption((option) => option
				.setName("alias")
				.setDescription("Alias du personnage")
				.setRequired(false)
				.setAutocomplete(true)
			)
			.addStringOption((option) => option
				.setName("line")
				.setDescription("Couleur des lignes. Par défaut: #0e47b2")
				.setRequired(false)
			)
			.addStringOption((option) => option
				.setName("background")
				.setDescription("Couleur du fond du graphique. Par défaut: #0e47b2")
				.setRequired(false)
			)
		)
		.addSubcommand((subcommand) => subcommand
			.setName("personalized")
			.setDescription("Génère un graphique pour un personnage personnalisé")
			.addStringOption((option) => option
				.setName("line")
				.setDescription("Couleur des lignes. Par défaut: #0e47b2")
				.setRequired(false)
			)
			.addStringOption((option) => option
				.setName("background")
				.setDescription("Couleur du fond du graphique. Par défaut: #0e47b2")
				.setRequired(false)
			)
			.addNumberOption((option) => option
				.setName("force")
				.setDescription("Force du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
			.addNumberOption((option) => option
				.setName("constitution")
				.setDescription("Constitution du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
			.addNumberOption((option) => option
				.setName("agilite")
				.setDescription("Agilité du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
			.addNumberOption((option) => option
				.setName("intelligence")
				.setDescription("Intelligence du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
			.addNumberOption((option) => option
				.setName("psychologie")
				.setDescription("Psychologie du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
			.addNumberOption((option) => option
				.setName("perception")
				.setDescription("Perception du personnage")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(20)
			)
		),
	async autocomplete(interaction: AutocompleteInteraction) {
		const opt = interaction.options as CommandInteractionOptionResolver;
		const focused = opt.getFocused(true);
		const choices: string[] = [];
		const user = opt.getUser("user", false) as User || interaction.user;
		const chara = get(user.id, interaction.guild?.id ?? "0");
		/** list all characters */
		if (chara) {
			chara.forEach((value: Statistiques) => {
				if (value.characterName) {
					choices.push(capitalize(value.characterName.replace("main", "personnage principal")));
				}
			});
		}
		const results = choices.filter(choice => latinise(choice.toLowerCase()).includes(latinise(focused.value).toLowerCase()));
		await interaction.respond(
			results.map(result => ({name: result, value: result}))
		);
	},
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const subcommand = options.getSubcommand();
		switch (subcommand) {
		case "chara": 
			await generateGraph(interaction, options);
			break;
		case "personalized":
			await generateGraphPersonalized(interaction, options);
			break;
		}
	}
};
async function generateGraph(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const user = options.getUser("user") as User || interaction.user;
	const name = options.getString("alias")?.replace(/personnage principal/i, "main") || "main";
	const color = generateColor(options.getString("line"), options.getString("background"));
	const graph = await imageChar(user.id, interaction!.guild!.id, name, color.line, color.background);
	if (!graph) {
		await interaction.reply("Aucune statistique trouvée");
		return;
	}
	await interaction.reply({files: [graph as AttachmentBuilder]});
}

async function generateGraphPersonalized(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const stats: Statistiques = {
		stats: {
			force: options.getNumber("force") ?? 10,
			constitution: options.getNumber("constitution") ?? 10,
			agilite: options.getNumber("agilite") ?? 10,
			intelligence: options.getNumber("intelligence") ?? 10,
			psychologie: options.getNumber("psychologie") ?? 10,
			perception: options.getNumber("perception") ?? 10
		}
	};
	const color = generateColor(options.getString("line"), options.getString("background"));
	const graph = await imagePersonalized(stats, color.line, color.background);
	if (!graph) {
		await interaction.reply("Une erreur est survenue");
		return;
	}
	await interaction.reply({files: [graph as AttachmentBuilder]});
}

function generateColor(line: string | null, background: string | null) {
	if (line && !background) {
		background = convertHexToRGBA(line, 0.5);
	} else if (!line && background) {
		line = convertHexToRGBA(background, 1);
	} else if (!line && !background) {
		line = "#0e47b2";
		background = "#0e47b2";
	}
	line = convertHexToRGBA(line as string, 1);
	background = convertHexToRGBA(background as string, 0.5);
	return {line, background};
}

function convertHexToRGBA(color: string, alpha?: number) {
	const parsedColor = parse(color);
	if (alpha) {
		parsedColor.rgba[parsedColor.rgba.length - 1] = alpha;
	}
	return `rgba(${parsedColor.rgba.join(", ")})`;
}
