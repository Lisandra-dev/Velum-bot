import {
	Attachment,
	CategoryChannel,
	Channel,
	channelMention,
	CommandInteraction,
	CommandInteractionOptionResolver,
	DMChannel,
	Embed,
	EmbedBuilder,
	GuildMember,
	GuildTextBasedChannel,
	Message,
	OverwriteType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	Snowflake,
	TextBasedChannel,
	TextChannel,
	userMention
} from "discord.js";
import {getConfig} from "../../maps";
import {logInDev} from "../../utils";
import {hasStaffRole} from "../../utils/data_check";
import * as fs from "fs";


export default {
	data: new SlashCommandBuilder()
		.setName("ticket")
		.setDMPermission(false)
		
		.setDescription("Crée un ticket pour contacter le staff")
		.addSubcommand((subcommand) => subcommand
			.setName("open")
			.setDescription("Ouvre un ticket")
			.addStringOption((option) => option
				.setName("raison")
				.setDescription("Raison du ticket")
				.setRequired(false)
			)
		)
		.addSubcommand((subcommand) => subcommand
			.setName("update")
			.setDescription("Met à jour un ticket (Modérateur uniquement)")
			.addStringOption((option) => option
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
		.addSubcommand((subcommand) => subcommand
			.setName("close")
			.setDescription("Ferme un ticket (Modérateur uniquement)")
		)
		.addSubcommand((subcommand) => subcommand
			.setName("transcript")
			.setDescription("Envoie la transcription d'un ticket (Modérateur uniquement)")
		)
		.addSubcommandGroup((subcommandGroup) => subcommandGroup
			.setName("members")
			.setDescription("Gère les membres d'un ticket")
			.addSubcommand((subcommand) => subcommand
				.setName("add")
				.setDescription("Ajoute un membre à un ticket (Modérateur uniquement)")
				.addUserOption((option) => option
					.setName("membre")
					.setDescription("Membre à ajouter")
					.setRequired(true)
				)
			)
			.addSubcommand((subcommand) => subcommand
				.setName("remove")
				.setDescription("Retire un membre d'un ticket (Modérateur uniquement)")
				.addUserOption((option) => option
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
			let raison: string | null = options.getString("raison") ?? "";
			const user = interaction.member as GuildMember;
			const guild = interaction.guild;
			const startEmoji = "📩";
			const ticketCategory = getConfig(interaction.guild.id, "ticket");
			if (!ticketCategory) {
				await interaction.reply("Aucune catégorie de ticket n'a été définie, vous ne pouvez pas utiliser cette commande !");
				return;
			}
			const channelFindByID = guild.channels.cache.find((channel) => channel.id === ticketCategory) as CategoryChannel;
			if (!channelFindByID) {
				await interaction.reply("La catégorie de ticket n'a pas été trouvée, veuillez contacter un administrateur !");
				return;
			}
			const staff = getConfig(interaction.guild.id, "staff");
			const staffRole = guild.roles.cache.find((role) => role.id === staff);
			const nickName = user.nickname ?? user.user.globalName ?? user.displayName;
			logInDev(`Ticket de ${nickName} créé`);
			const newTicket = await channelFindByID?.children.create({
				name: `${startEmoji}╏⌈${nickName}⌋${raison}`,
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
				]
			});
			
			if (!newTicket) {
				await interaction.reply("Le ticket n'a pas pu être créé, veuillez contacter un administrateur !");
				return;
			}
			if (staffRole) {
				await newTicket.permissionOverwrites.create(staffRole, {
					ViewChannel: true,
					SendMessages: true,
					ReadMessageHistory: true
				});
			}
			await interaction.reply({
				content: `Votre ticket a été créé dans ${channelMention(newTicket.id)}`,
				ephemeral: true
			});
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
			await interaction.deferReply({ephemeral: true});
			if (!hasRole) {
				await interaction.editReply({content: "Vous n'avez pas la permission de faire cela !"});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.editReply({content: "Ce salon n'est pas un ticket !"});
				return;
			}
			const ticket = interaction.channel as GuildTextBasedChannel;
			await ticketContent(ticket, interaction);
			await interaction.editReply({content: "Le ticket a été fermé !"});
			//delete ticket
			await ticket.delete();
		} else if (subcommand === "transcript") {
			const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild.id);
			await interaction.deferReply({ephemeral: true});
			if (!hasRole) {
				await interaction.editReply({content: "Vous n'avez pas la permission de faire cela !"});
				return;
			}
			const verif = verifTicket(interaction.channel, interaction.guild.id);
			if (!verif) {
				await interaction.editReply({content: "Ce salon n'est pas un ticket !"});
				return;
			}
			const ticket = interaction.channel as GuildTextBasedChannel;
			await ticketContent(ticket, interaction);
			const channelTranscript = getConfig(interaction.guild.id, "transcript") as string;
			await interaction.editReply({content: `Le transcript a été envoyé dans ${channelMention(channelTranscript)}`});
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
		} else if (group === "members" && subcommand === "remove") {
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
				await interaction.reply({
					content: "Vous ne pouvez pas supprimer un membre du staff ou le bot !",
					ephemeral: true
				});
				return;
			}
			await ticket.permissionOverwrites.delete(user);
			await interaction.reply({content: `${userMention(user.id)} a bien été supprimé du ticket`, ephemeral: true});
		}
	}
};

function verifTicket(ticket: TextBasedChannel | null, guildID: string) {
	if (!ticket || ticket.isDMBased()) {
		return false;
	}
	/** verification that the ticket is in the category ticket */
	const ticketCategory = getConfig(guildID, "ticket");
	const ticketParent = ticket.parent ? ticket.parent.id : "0";
	return (ticketParent && ticketParent === ticketCategory);
}

/**
 * When the ticket is closed, the content of the ticket is saved in a txt file and send in a channel (configurable)
 * @param ticket: the ticket to save
 * @param interaction: the interaction to reply
 * @returns the content of the ticket
 */
async function ticketContent(ticket: TextBasedChannel | null, interaction: CommandInteraction) {
	if (!ticket || ticket.isDMBased()) {
		return null;
	}
	const messages = await fetchAllMessages(ticket);
	const formattedContent = messages.messages
		.sort((a, b) => a.message.createdAt.getTime() - b.message.createdAt.getTime())
		.map((message) => {
			if (message.message.attachments.size > 0) {
				return `\`[${formatDate(message.message.createdAt)}] ${message.message.author.displayName}:\`\n- ${message.message.attachments.map((attachment) => {
					return attachment.url.split("/").pop();
				}).join("\n- ")}\n`;
			} else if (message.message.content.trim().length > 0) {
				const author = message.message.author.displayName;
				const content = message.message.content.replace(/\n/g, "\n  ");
				const date = formatDate(message.message.createdAt);
				return `\`[${date}] ${author}:\`\n  ${content}\n`;
			} else if (message.embeds) {
				const author = message.message.author.displayName;
				const date = formatDate(message.message.createdAt);
				const embed = message.embeds.map((embed) => {
					return formatEmbed(embed);
				});
				return `\`[${date}] ${author}:\`\n${embed.join("\n")}`;
			}
			return "";
		})
		.join("\n---\n");
	
	/** create a txt file with the content of the ticket using fs */
	fs.writeFileSync(`${ticket.name}.md`, formattedContent, "utf-8");
	const targetChannel = getConfig(interaction.guild!.id, "transcript") as string;
	const channel = interaction.guild!.channels.cache.get(targetChannel) as TextChannel;
	const files = messages.messageFiles;
	await channel.send({
		content: `Transcript du ticket \`#${ticket.name}\` créé le <t:${unixEpochInSecond()}:d> par ${userMention(interaction.user.id)}`,
		files: [
			{
				attachment: `${ticket.name}.md`, contentType: "text/plain", name: `${ticket.name}.md`,
			},
			...files
		]
	});
	fs.unlinkSync(`${ticket.name}.md`);
	return formattedContent;
}

function formatDate(date: Date): string {
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear().toString();
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	
	return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

interface FetchAllMessagesResult {
	messages: {
		message: Message;
		embeds: Embed[];
	}[];
	messageFiles: Attachment[];
}

async function fetchAllMessages(channel: TextBasedChannel): Promise<FetchAllMessagesResult> {
	const messages: Array<{ message: Message; embeds: Embed[] }> = [];
	let lastMessageID: Snowflake | undefined;
	let continueFetching = true;
	while (continueFetching) {
		const options: { limit?: number; before?: Snowflake } = {limit: 100, ...(lastMessageID && {before: lastMessageID})};
		const fetchedMessages = await channel.messages.fetch(options);
		if (fetchedMessages.size === 0) {
			continueFetching = false;
		} else {
			const sortedMessages = Array.from(fetchedMessages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
			messages.push(...sortedMessages.map(message => ({
				message,
				embeds: message.embeds,
			})));
			lastMessageID = fetchedMessages.lastKey();
		}
	}
	/** get all files */
	const messageFiles = messages
		.filter((message) => message.message.attachments.size > 0)
		.map((message) => message.message.attachments.map((attachment) => attachment))
		.reduce((acc, val) => acc.concat(val), []);
	/**
	 * Replace mention role by role name, mention channel by channel name and mention user by user name
	 */
	messages.forEach((message) => {
		message.message.mentions.roles.forEach((role) => {
			message.message.content = message.message.content.replace(`<@&${role.id}>`, `@${role.name}`);
		});
		message.message.mentions.channels.forEach((channel: Channel) => {
			if (!channel.partial && (!(channel instanceof DMChannel))) {
				message.message.content = message.message.content.replace(`<#${channel.id}>`, `#${channel.name}`);
			}
		});
		message.message.mentions.users.forEach((user) => {
			message.message.content = message.message.content.replace(`<@${user.id}>`, `@${user.globalName ?? user.username}`);
		});
	});
	return {messages, messageFiles};
}

/**
 * Convert the embed format from JSON to Markdown
 */
function formatEmbed(embed: Embed) {
	return `${embed.author ? `  > *${embed.author.name}*\n` : ""}${embed.title ? `  > **${embed.title}**\n` : ""}${embed.description ? `  > ${embed.description}\n` : ""}${embed.fields ? embed.fields.map((field) => `  >> **${field.name}**\n>> ${field.value}`).join("\n  >") : ""}${embed.image ? `  > ${embed.image.url}\n` : ""}${embed.footer ? `  > *${embed.footer.text}*\n` : ""}${embed.timestamp ? `  > ${embed.timestamp}\n` : ""}${embed.url ? `  > ${embed.url}\n` : ""}${embed.thumbnail ? `  > ${embed.thumbnail.url}\n` : ""}`;
}

function unixEpochInSecond() {
	return Math.floor(new Date().getTime() / 1000);
}
