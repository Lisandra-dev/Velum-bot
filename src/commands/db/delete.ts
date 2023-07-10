import {
	ActionRowBuilder,
	ButtonStyle,
	CommandInteraction,
	CommandInteractionOptionResolver,
	PermissionFlagsBits,
	ButtonBuilder,
	SlashCommandBuilder,
	userMention, AutocompleteInteraction
} from "discord.js";
import {getCharacters, removeUser, removeCharacter, get} from "../../maps";
import {Statistiques} from "../../interface";
import {latinize} from "../../utils";
import {capitalize} from "../../display/results";

export default {
	data: new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Supprimer un personnage")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addUserOption( (option) => option
			.setName("user")
			.setDescription("Utilisateur à qui supprimer le personnage")
			.setRequired(true)
		)
		.addBooleanOption( (option) => option
			.setName("all")
			.setDescription("Supprimer tous les personnages")
			.setRequired(false)
		)
		.addStringOption( (option) => option
			.setName("alias")
			.setDescription("Alias du personnage secondaire (DC)")
			.setRequired(false)
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
		const results = choices.filter(choice => latinize(choice.toLowerCase()).includes(latinize(focused.value.toLowerCase())));
		await interaction.respond(
			results.map(result => ({ name: result, value: result }))
		);
	},
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user", true);
		const name = options.getString("alias")?.replace(/personnage principal/i, "main") ?? "main";
		const all = options.getBoolean("all") ?? false;
		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				new ButtonBuilder()
					.setCustomId("confirm")
					.setLabel("Confirmer")
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId("cancel")
					.setLabel("Annuler")
					.setStyle(ButtonStyle.Primary)
			);
		const getChar = getCharacters(user.id, interaction.guild.id, name);
		if (!getChar) {
			await interaction.reply({
				content: `Le personnage ${name === "main" ? "principal" : name} de ${userMention(user.id)} n'existe pas`,
				ephemeral: true
			});
			return;
		}
		if (all) {
			/** create button  */
			
			await interaction.reply({
				content: `Êtes-vous sûr de vouloir supprimer tous les personnages de de ${userMention(user.id)} ?`,
				components: [row],
				ephemeral: true,
				fetchReply: true
			});
			const message = await interaction.fetchReply();
			/** create collector */
			const collector = message.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: 10000
			});
			collector?.on("collect", async (i) => {
				if (!interaction.guild) return;
				if (i.customId === "confirm") {
					removeUser(user.id, interaction.guild.id);
					await i.update({
						content: `Tous les personnages de ${userMention(user.id)} ont été supprimés`,
						components: []
					});
				}
				if (i.customId === "cancel") {
					await i.update({
						content: "Suppression annulée",
						components: []
					});
				}
			});
			collector?.on("end", async (collected) => {
				if (collected.size === 0) {
					await interaction.editReply({
						content: "Suppression annulée",
						components: []
					});
				}
			});
			return;
		} else {
			await interaction.reply({
				content: `Êtes-vous sûr de vouloir supprimer le ${name === "main" ? "personnage principal" : name} de ${userMention(user.id)} ?`,
				components: [row],
				ephemeral: true,
				fetchReply: true
			});
			const message = await interaction.fetchReply();
			/** create collector */
			const collector = message.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				time: 10000
			});
			collector?.on("collect", async (i) => {
				if (!interaction.guild) return;
				if (i.customId === "confirm") {
					const deleted = removeCharacter(user.id, interaction.guild.id, name);
					if (deleted) {
						await i.update({
							content: `Le personnage ${name === "main" ? "principal" : name} de ${userMention(user.id)} a été supprimé`,
							components: []
						});
					} else {
						await i.update({
							content: `Le personnage ${name === "main" ? "principal" : name} de ${userMention(user.id)} n'existe pas`,
							components: []
						});
					}
				}
				if (i.customId === "cancel") {
					await i.update({
						content: "Suppression annulée",
						components: []
					});
				}
			});
			collector?.on("end", async (collected) => {
				if (collected.size === 0) {
					await interaction.editReply({
						content: "Suppression annulée",
						components: []
					});
				}
			});
			return;
		}
	}
};
