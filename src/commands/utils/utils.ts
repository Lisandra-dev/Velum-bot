import {
	AttachmentBuilder,
	AutocompleteInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	PermissionFlagsBits,
	SlashCommandBuilder, User
} from "discord.js";
import parse from "parse-color";

import {Statistiques} from "../../interface";
import {get} from "../../maps";
import {capitalize, latinise, roundUp} from "../../utils";
import { imageChar} from "../../utils/graph-html";

export default {
	data: new SlashCommandBuilder()
		.setName("utils")
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDescription("Commandes utilitaires pour les MJ")
		.addSubcommand((subcommand) => subcommand
			.setName("pc")
			.setDescription("Calcule les PC pour une compétence")
			.addIntegerOption((option) => option
				.setName("modifier")
				.setDescription("Nombre d'effet de la compétence")
				.setRequired(true)
			)
			.addIntegerOption((option) => option
				.setName("temps")
				.setDescription("Durée du modifier")
				.setRequired(false)
			)
			.addBooleanOption((option) => option
				.setName("personnel")
				.setDescription("Est-ce que le modifier est personnel ?")
				.setRequired(false)
			)
			.addBooleanOption((option) => option
				.setName("gratuite")
				.setDescription("Est-ce que l'action est gratuite ?")
				.setRequired(false)
			)
		)
		.addSubcommand((subcommand) => subcommand
			.setName("graph")
			.setDescription("Génère un graphique")
			.addUserOption((option) => option
				.setName("user")
				.setDescription("Utilisateur à qui créer le personnage")
				.setRequired(true)
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
		),
	async autocomplete(interaction: AutocompleteInteraction) {
		const opt = interaction.options as CommandInteractionOptionResolver;
		const focused = opt.getFocused(true);
		const choices: string[] = [];
		const chara = get(interaction.user.id, interaction.guild?.id ?? "0");
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
		let pool: number = 0;
		const options = interaction.options as CommandInteractionOptionResolver;
		if (options.getSubcommand() === "pc") {
			const modifier = options.getInteger("modifier", true);
			const temps = options.getInteger("temps", false) ?? 1;
			const param: string[] = [];
			if (options.getBoolean("personnel", false)) {
				pool++;
				param.push( "**personnel**");
			}
			if (options.getBoolean("gratuite", false)) {
				pool++;
				param.push("**gratuite**");
			}
			const formula = roundUp( (modifier * temps) /2 ) + pool;
    
			await interaction.reply(`Le nombre de PC "optimal" pour cette compétence ${param.join(" et ")} est de ${formula} PC`);
		} else if (options.getSubcommand() === "graph") {
			if (!interaction.guild) return;
			const options = interaction.options as CommandInteractionOptionResolver;
			const user = options.getUser("user") as User || interaction.user;
			const name = options.getString("alias")?.replace(/personnage principal/i, "main") || "main";
			let line = options.getString("line");
			let background = options.getString("background");
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
			const graph = await imageChar(user.id, interaction.guild.id, name, line as string, background as string);
			if (!graph) {
				await interaction.reply("Aucune statistique trouvée");
			}
			await interaction.reply({files: [graph as AttachmentBuilder]});
		}
	}
};

function convertHexToRGBA(color: string, alpha?: number) {
	const parsedColor = parse(color);
	if (alpha) {
		parsedColor.rgba[parsedColor.rgba.length - 1] = alpha;
	}
	return `rgba(${parsedColor.rgba.join(", ")})`;
}

