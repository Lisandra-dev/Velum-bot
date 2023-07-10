import { Statistiques } from "src/interface";
import {getCharacters} from "../maps";
import {dedent} from "ts-dedent";
import {CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, User, userMention} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("get")
		.setDescription("Voir ses statistiques, ou celles d'un autre utilisateur ou personnage.")
		.addUserOption( (option) => option
			.setName("user")
			.setDescription("Si vous voulez voir les stats d'un autre utilisateur")
			.setRequired(false)
		)
		.addStringOption( (option) => option
			.setName("alias")
			.setDescription("Si vous voulez voir les stats d'un personnage")
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user") as User || interaction.user;
		const name = options.getString("alias") || "main";
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
