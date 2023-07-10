import { ActionRowBuilder,
	ButtonStyle, 
	CommandInteraction, 
	CommandInteractionOptionResolver, 
	PermissionFlagsBits, 
	ButtonBuilder,
	SlashCommandBuilder, 
	userMention} from "discord.js";
import { getCharacters, removeUser, removeCharacter } from "../maps";

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
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user") || interaction.user;
		const name = options.getString("alias") ?? "main";
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
