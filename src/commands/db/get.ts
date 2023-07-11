import { Statistiques } from "src/interface";
import {get, getCharacters} from "../../maps";
import {dedent} from "ts-dedent";
import {
	AutocompleteInteraction,
	CommandInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder,
	User,
	userMention
} from "discord.js";
import {latinise, capitalize} from "../../utils";

export default {
	data: new SlashCommandBuilder()
		.setName("get")
		.setDMPermission(false)
		.setDescription("Voir ses statistiques, ou celles d'un autre utilisateur ou personnage.")
		.addUserOption( (option) => option
			.setName("user")
			.setDescription("Si vous voulez voir les stats d'un autre utilisateur")
			.setRequired(false)
		)
		.addStringOption( (option) => option
			.setName("alias")
			.setDescription("Alias du personnage secondaire (DC)")
			.setAutocomplete(true)
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
			results.map(result => ({ name: result, value: result }))
		);
	},
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user") as User || interaction.user;
		const name = options.getString("alias")?.replace(/personnage principal/i, "main") || "main";
		const chara = getCharacters(user.id, interaction.guild.id, name) as Statistiques;
		if (!chara) {
			await interaction.reply({
				content: `Aucun personnage trouvé pour ${userMention(user.id)} avec le nom ${name}`,
			});
			return;
		}
		const stats = chara.stats;
		const contentName = name !== "main" ? ` pour le personnage ${name}` : " pour son personnage principal";
		const content = dedent(`Statistiques de ${userMention(user.id)}${contentName} :
		- __Force__ : ${stats.force}
		- __Constitution__ : ${stats.constitution}
		- __Agilité__ : ${stats.agilite}
		- __Intelligence__ : ${stats.intelligence}
		- __Psychologie__ : ${stats.psychologie}
		- __Perception__ : ${stats.perception}`);
		await interaction.reply({
			content,
		});
		return;
	}
};
