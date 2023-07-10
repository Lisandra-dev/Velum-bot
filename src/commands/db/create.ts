import {SlashCommandBuilder, User, userMention} from "discord.js";
import {set} from "../../maps";
import { CommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("create")
		.setDescription("Créer un personnage")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addUserOption( (option) => option
			.setName("user")
			.setDescription("Utilisateur à qui créer le personnage")
			.setRequired(true)
		)
		.addNumberOption( (option) => option
			.setName("force")
			.setDescription("Force du personnage")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addNumberOption( (option) => option
			.setName("constitution")
			.setDescription("Constitution du personnage")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addNumberOption( (option) => option
			.setName("agilite")
			.setDescription("Agilité du personnage")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addNumberOption( (option) => option
			.setName("intelligence")
			.setDescription("Intelligence du personnage")	
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addNumberOption( (option) => option
			.setName("psychologie")
			.setDescription("Psychologie du personnage")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addNumberOption( (option) => option
			.setName("perception")
			.setDescription("Perception du personnage")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20)
		)
		.addStringOption( (option) => option
			.setName("alias")
			.setDescription("Alias du personnage secondaire (DC)")
			.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guildId) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user") as User;
		const name = options.getString("alias") ?? "main";
		const force = options.getNumber("force") ?? 10;
		const constitution = options.getNumber("constitution") ?? 10;
		const agilite = options.getNumber("agilite") ?? 10;
		const intelligence = options.getNumber("intelligence") ?? 10;
		const psychologie = options.getNumber("psychologie") ?? 10;
		const perception = options.getNumber("perception") ?? 10;
		const stats = {
			characterName: name,
			stats: {
				force: force,
				constitution: constitution,
				agilite: agilite,
				intelligence: intelligence,
				psychologie: psychologie,
				perception: perception
			}
		};
		set(user.id, interaction.guildId, stats);
		await interaction.reply(`Personnage ${name === "main" ? "principal" : name} créé pour ${userMention(user.id)}`);
	}
};
