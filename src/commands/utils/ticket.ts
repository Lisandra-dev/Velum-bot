import {
	CategoryChannel, channelMention,
	CommandInteraction,
	CommandInteractionOptionResolver,
	EmbedBuilder, GuildMember, GuildTextBasedChannel, OverwriteType, PermissionFlagsBits,
	SlashCommandBuilder, TextChannel, userMention
} from "discord.js";
import {getConfig} from "../../maps";
import {hasStaffRole, logInDev, verifTicket} from "../../utils";

export default {
	data: new SlashCommandBuilder()
		.setName("ticket")
		.setDescription("Crée un ticket pour contacter le staff")
		.addSubcommand( (subcommand) => subcommand
			.setName("open")
			.setDescription("Ouvre un ticket")
			.addStringOption( (option) => option
				.setName("raison")
				.setDescription("Raison du ticket")
				.setRequired(false)
			)
		)
		.addSubcommand( (subcommand) => subcommand
			.setName("update")
			.setDescription("Met à jour un ticket (Modérateur uniquement)")
			.addStringOption( (option) => option
				.setName("etat")
				.setDescription("Etat du ticket")
				.setRequired(true)
				.addChoices(
					{
						name: "Commencée",
						value: "📩",
					},
					{
						name: "À faire",
						value: "📝",
					},
					{
						name: "En cours",
						value: "⌛",
					},
					{
						name: "Validée",
						value: "✅",
					})
			)
		)
		.addSubcommand( (subcommand) => subcommand
			.setName("close")
			.setDescription("Ferme un ticket (Modérateur uniquement)")
		)
		.addSubcommandGroup( (subcommandGroup) => subcommandGroup
			.setName("members")
			.setDescription("Gère les membres d'un ticket")
			.addSubcommand( (subcommand) => subcommand
				.setName("add")
				.setDescription("Ajoute un membre à un ticket (Modérateur uniquement)")
				.addUserOption( (option) => option
					.setName("membre")
					.setDescription("Membre à ajouter")
					.setRequired(true)
				)
			)
			.addSubcommand( (subcommand) => subcommand
				.setName("remove")
				.setDescription("Retire un membre d'un ticket (Modérateur uniquement)")
				.addUserOption( (option) => option
					.setName("membre")
					.setDescription("Membre à retirer")
					.setRequired(true)
				)
			)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild || !interaction.member) return;
		const options = interaction.options as CommandInteractionOptionResolver;
		const subcommand = options.getSubcommand();
		const group = options.getSubcommandGroup();
		if (subcommand === "open") {
			let raison :string | null = options.getString("raison") ?? "";
			if (raison) raison = ` ${raison}`;
			else raison = "";
			const user = interaction.member as GuildMember;
			const guild = interaction.guild;
			const startEmoji = "📩";
			const ticketCategory = getConfig(interaction.guild.id, "ticket");
			if (!ticketCategory) {
				await interaction.reply("Aucune catégorie de ticket n'a été définie, vous ne pouvez pas utiliser cette commande !");
				return;
			}
			const channelFindByID = guild.channels.cache.find( (channel) => channel.id === ticketCategory) as CategoryChannel;
			if (!channelFindByID) {
				await interaction.reply("La catégorie de ticket n'a pas été trouvée, veuillez contacter un administrateur !");
				return;
			}
			const staff = getConfig(interaction.guild.id, "staff");
			const staffRole = guild.roles.cache.find( (role) => role.id === staff);
			const nickName = user.nickname ?? user.user.globalName ?? user.displayName;
			logInDev(user as GuildMember);
			logInDev(`Ticket de ${nickName} créé`);
			const newTicket = await channelFindByID?.children.create({name: `${startEmoji}╏${nickName}${raison}`,
				permissionOverwrites: [
					{
						id: user,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
						type: OverwriteType.Member
					},
					{
						id: interaction.client.user,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
						type: OverwriteType.Member
					},
					{
						id: guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					}
				]});
			
			if (!newTicket) {
				await interaction.reply("Le ticket n'a pas pu être créé, veuillez contacter un administrateur !");
				return;
			}
			if (staffRole) {
				await newTicket.permissionOverwrites.create(staffRole, {ViewChannel: true, SendMessages: true, ReadMessageHistory: true});
			}
			await interaction.reply({content: `Votre ticket a été créé dans ${channelMention(newTicket.id)}`,
				ephemeral: true});
			raison = raison.length > 0 ? "Raison : " + raison : null;
			const reply = new EmbedBuilder()
				.setTitle(`Ticket de ${nickName}`)
				.setDescription(raison)
				.setColor("#276083");
			await newTicket.send({embeds: [reply]});
		} else if (subcommand === "update") {
			/** Allow only moderator to update ticket */
			const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild.id);
			if (!hasRole) {
				await interaction.reply({content: "Vous n'avez pas la permission de faire cela !", ephemeral: true});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.reply({content: "Ce salon n'est pas un ticket !", ephemeral: true});
				return;
			}
			const ticket = interaction.channel as GuildTextBasedChannel;
			const etat = options.getString("etat", true);
			await ticket.setName(ticket.name.replace(/[📩📝⌛✅]/u, etat));
			await interaction.reply({content: "Le ticket a été mis à jour !", ephemeral: true});
		} else if (subcommand === "close") {
			const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild.id);
			if (!hasRole) {
				await interaction.reply({content: "Vous n'avez pas la permission de faire cela !", ephemeral: true});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.reply({content: "Ce salon n'est pas un ticket !", ephemeral: true});
				return;
			}
			const ticket = interaction.channel as GuildTextBasedChannel;
			//delete ticket
			await ticket.delete();
			
		} else if (group === "members" && subcommand === "add") {
			const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild.id);
			if (!hasRole) {
				await interaction.reply({content: "Vous n'avez pas la permission de faire cela !", ephemeral: true});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.reply({content: "Ce salon n'est pas un ticket !", ephemeral: true});
				return;
			}
			const ticket = interaction.channel as TextChannel;
			const user = options.getUser("membre", true);
			await ticket.permissionOverwrites.create(user, {ViewChannel: true, SendMessages: true, ReadMessageHistory: true});
			await interaction.reply({content: `${userMention(user.id)} a bien été ajouté au ticket`, ephemeral: true});
		}
		else if (group === "members" && subcommand === "remove") {
			const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild.id);
			if (!hasRole) {
				await interaction.reply({content: "Vous n'avez pas la permission de faire cela !", ephemeral: true});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.reply({content: "Ce salon n'est pas un ticket !", ephemeral: true});
				return;
			}
			const ticket = interaction.channel as TextChannel;
			const user = options.getUser("membre", true);
			const member = interaction.guild.members.cache.get(user.id) as GuildMember;
			/** not remove staff or bot */
			if (hasStaffRole(member, interaction.guild.id) || user.id === interaction.client.user.id) {
				await interaction.reply({content: "Vous ne pouvez pas supprimer un membre du staff ou le bot !", ephemeral: true});
				return;
			}
			await ticket.permissionOverwrites.delete(user);
			await interaction.reply({content: `${userMention(user.id)} a bien été supprimé du ticket`, ephemeral: true});
		}
	}
};
