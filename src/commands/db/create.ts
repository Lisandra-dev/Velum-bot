import {
	CommandInteraction,
	CommandInteractionOptionResolver,
	PermissionFlagsBits,
	SlashCommandBuilder,
	User,
	userMention
} from "discord.js";

import {getConfig, set} from "../../maps";

export default {
	data: new SlashCommandBuilder()
		.setName("create")
		.setDescription("Créer un personnage")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		
		.addUserOption((option) => option
			.setName("user")
			.setDescription("Utilisateur à qui créer le personnage")
			.setRequired(true)
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
		.addStringOption((option) => option
			.setName("alias")
			.setDescription("Alias du personnage secondaire (DC)")
			.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const user = options.getUser("user", true) as User;
		const member = interaction.guild.members.cache.get(user.id);
		if (!member) return;
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
		set(user.id, interaction.guild.id, stats);
		const roleIDToAdd = getConfig(interaction.guild.id, "role.add") as string[];
		const roleIDToRemove = getConfig(interaction.guild.id, "role.remove") as string[];
		if (roleIDToAdd.length > 0) {
			roleIDToAdd.forEach((id) => {
				member.roles.add(id);
			});
		}
		if (roleIDToRemove.length > 0) {
			roleIDToRemove.forEach((id) => {
				member.roles.remove(id);
			});
		}
		await interaction.reply(`Personnage ${name === "main" ? "principal" : name} créé pour ${userMention(user.id)}`);
	}
};
