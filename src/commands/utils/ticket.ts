import {
	ActionRowBuilder,
	Attachment, ButtonBuilder, ButtonStyle,
	CategoryChannel,
	channelMention,
	CommandInteraction,
	CommandInteractionOptionResolver,
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
import {createTranscript} from "discord-html-transcripts";
import AdmZip from "adm-zip";

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
			await openTicket(interaction, options);
		} else if (subcommand === "update") {
			await updateStatut(interaction, options);
		} else if (subcommand === "close") {
			await closeTicket(interaction);
		} else if (subcommand === "transcript") {
			await transcriptTicket(interaction);
		} else if (group === "members" && subcommand === "add") {
			await addMember(interaction, options);
		} else if (group === "members" && subcommand === "remove") {
			await removeMember(interaction, options);
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
 * @param close
 * @returns the content of the ticket
 */
async function ticketContent(ticket: TextBasedChannel | null, interaction: CommandInteraction, close?: boolean) {
	if (!ticket || ticket.isDMBased()) {
		return false;
	}
	const targetChannel = getConfig(interaction.guild!.id, "transcript") as string;
	let channel = interaction.guild!.channels.cache.get(targetChannel);
	if (!channel && close) {
		return await confirmCloseWithoutTranscript(interaction);
	} else if (!channel) {
		await interaction.editReply({content: "Vous n'avez pas configuré de channel pour les transcripts !"});
		return false;
	}
	channel = channel as TextChannel;
	return await createTranscriptAttachment(ticket as TextChannel, channel, interaction, close);
}

async function generateZip(ticket: TextBasedChannel) {
	const transcript = await createTranscript(ticket, {
		limit: -1,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		filename: `${ticket.name}.html`,
		saveImages: false,
		poweredBy: false,
	});
		/** get all attachments **/
	const files = await fetchFiles(ticket, true);
	/** create html file + zip it */
	const buffer = Buffer.from(transcript.attachment as Buffer);
	// zip file
	const zip = new AdmZip();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	zip.addFile(`${ticket.name}.html`, buffer);
	/** also add other attachments **/
	for (const file of files) {
		/** download file */
		const contents = await fetch(file.url);
		if (!contents.ok) {
			break;
		}
		const buffer = await contents.arrayBuffer();
		/** create file */
		zip.addFile(file.name, Buffer.from(buffer));
	}
	return zip;
}

async function fetchFiles(channel: TextBasedChannel, image?: boolean ): Promise<Attachment[]> {
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
	const files =  messages
		.filter((message) =>
			message.message.attachments.size > 0
		)
		.map((message) =>
			message.message.attachments.map((attachment) => attachment)
		)
		.reduce((acc, val) =>
			acc.concat(val), []
		);
	if (!image) {
		return files.filter((attachment) =>
			!attachment.name.match(/(png|gifv?|jpe?g|web[pm])$/gi)
		);
	}
	return files;
}

function unixEpochInSecond() {
	return Math.floor(new Date().getTime() / 1000);
}

async function canUpdateTicket(interaction: CommandInteraction) {
	const hasRole = hasStaffRole(interaction.member as GuildMember, interaction.guild!.id);
	if (!hasRole) {
		await interaction.reply({content: "Vous n'avez pas la permission de faire cela !", ephemeral: true});
		return false;
	}
	const verif = verifTicket(interaction.channel, interaction.guild!.id);
	if (!verif) {
		await interaction.reply({content: "Ce salon n'est pas un ticket !", ephemeral: true});
		return false;
	}
	return true;
}

async function openTicket(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	let raison: string | null = options.getString("raison") ?? "";
	const user = interaction.member as GuildMember;
	const guild = interaction.guild;
	const startEmoji = "📩";
	const ticketCategory = getConfig(interaction.guild!.id, "ticket");
	if (!ticketCategory) {
		await interaction.reply("Aucune catégorie de ticket n'a été définie, vous ne pouvez pas utiliser cette commande !");
		return;
	}
	const channelFindByID = guild!.channels.cache.find((channel) => channel.id === ticketCategory) as CategoryChannel;
	if (!channelFindByID) {
		await interaction.reply("La catégorie de ticket n'a pas été trouvée, veuillez contacter un administrateur !");
		return;
	}
	const staff = getConfig(interaction.guild!.id, "staff");
	const staffRole = guild!.roles.cache.find((role) => role.id === staff);
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
				id: guild!.roles.everyone,
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
}

/**
 * Allow moderator to update ticket status (on the name)
 * @param interaction {CommandInteraction} 
 * @param options {CommandInteractionOptionResolver}
 */
async function updateStatut(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const verif = await canUpdateTicket(interaction);
	if (!verif) return;
	const ticket = interaction.channel as GuildTextBasedChannel;
	const etat = options.getString("etat", true);
	await ticket.setName(ticket.name.replace(/[📩📝⌛✅]/u, etat));
	await interaction.reply({content: "Le ticket a été mis à jour !", ephemeral: true});
}

async function closeTicket(interaction: CommandInteraction) {
	const verif = await canUpdateTicket(interaction);
	if (!verif) return;
	await interaction.deferReply({ephemeral: true});
	const ticket = interaction.channel as GuildTextBasedChannel;
	const success = await ticketContent(ticket, interaction, true);
	if (!success) return;
	await interaction.editReply({content: "Le ticket a été fermé !"});
	//delete ticket
	await ticket.delete();
}

async function transcriptTicket(interaction: CommandInteraction) {
	const verif = await canUpdateTicket(interaction);
	if (!verif) return;
	await interaction.deferReply({ephemeral: true});
	const ticket = interaction.channel as GuildTextBasedChannel;
	const send = await ticketContent(ticket, interaction);
	if (!send) {
		return;
	}
	const channelTranscript = getConfig(interaction.guild!.id, "transcript") as string;
	await interaction.editReply({content: `Le transcript a été envoyé dans ${channelMention(channelTranscript)}`});
}

async function addMember(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const verif = await canUpdateTicket(interaction);
	if (!verif) return;
	const ticket = interaction.channel as TextChannel;
	const user = options.getUser("membre", true);
	await ticket.permissionOverwrites.create(user, {ViewChannel: true, SendMessages: true, ReadMessageHistory: true});
	await interaction.reply({content: `${userMention(user.id)} a bien été ajouté au ticket`, ephemeral: true});
}

async function removeMember(interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
	const verif = await canUpdateTicket(interaction);
	if (!verif) return;
	const ticket = interaction.channel as TextChannel;
	const user = options.getUser("membre", true);
	const member = interaction.guild!.members.cache.get(user.id) as GuildMember;
	/** not remove staff or bot */
	if (hasStaffRole(member, interaction.guild!.id) || user.id === interaction.client.user.id) {
		await interaction.reply({
			content: "Vous ne pouvez pas supprimer un membre du staff ou le bot !",
			ephemeral: true
		});
		return;
	}
	await ticket.permissionOverwrites.delete(user);
	await interaction.reply({content: `${userMention(user.id)} a bien été supprimé du ticket`, ephemeral: true});
}

async function confirmCloseWithoutTranscript(interaction: CommandInteraction) {
	//create button to prevent the user to close the ticket
	await interaction.editReply({content: "Vous n'avez pas configuré de channel pour les transcripts !"});
	const confirmButton = new ButtonBuilder()
		.setCustomId("confirm")
		.setLabel("Confirmer")
		.setStyle(ButtonStyle.Danger);
	const cancelButton = new ButtonBuilder()
		.setCustomId("cancel")
		.setLabel("Annuler")
		.setStyle(ButtonStyle.Secondary);
	const download = new ButtonBuilder()
		.setCustomId("download")
		.setLabel("Télécharger le transcript")
		.setStyle(ButtonStyle.Primary);
	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(confirmButton, cancelButton, download);
	await interaction.followUp(
		{content: "Voulez-vous quand même fermer le ticket ?",
			components: [row],
			ephemeral: true
		});
	// eslint-disable-next-line
		const collectorFilter = (i: any) => i.user.id === interaction.user.id;
	try {
		let confirm = await interaction.channel!.awaitMessageComponent({filter: collectorFilter, time: 60000});
		if (confirm.customId === "download") {
			await createTranscriptAttachment(interaction.channel as TextChannel, interaction.channel as TextChannel, interaction);
			await confirm.update({content: "Le transcript a été téléchargé !", components: []});
			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(confirmButton, cancelButton);
			await interaction.followUp({content: "Le transcript a été envoyé dans ce salon !\n Voulez vous continuer la fermeture du ticket ?\n**⚠️ Le channel sera supprimé !**", components: [row]});
			confirm = await interaction.channel!.awaitMessageComponent({filter: collectorFilter, time: 60000});
		}
		if (confirm.customId === "confirm") {
			await confirm.update({content: "Le ticket a été fermé !", components: []});
			return true;
		} else {
			await confirm.update({content: "Le ticket n'a pas été fermé !", components: []});
			return false;
		}
	} catch (e) {
		await interaction.editReply({content: "Le ticket n'a pas été fermé !", components: []
		});
		return false;
	}
}

async function createTranscriptAttachment(ticket: TextChannel, channel: GuildTextBasedChannel, interaction: CommandInteraction, close?: boolean) {
	
	const transcript = await createTranscript(ticket, {
		limit: -1,
		filename: `${ticket.name}.html`,
		saveImages: true,
		poweredBy: false,
	});
	//download files not image (image are already in the transcript)
	const files = await fetchFiles(ticket);
	try {
		await channel.send({
			content: `Transcript du ticket \`#${ticket.name}\` créé le <t:${unixEpochInSecond()}:d> par ${userMention(interaction.user.id)}`,
			files: [transcript, ...files]
		});
		return true;
	} catch (e) {
		try {
			const zip = await generateZip(ticket);
			await channel.send({
				content: `Transcript du ticket \`#${ticket.name}\` créé le <t:${unixEpochInSecond()}:d> par ${userMention(interaction.user.id)}`,
				files: [{
					attachment: zip.toBuffer(),
					name: `${ticket.name}.zip`
				}]
			});
			return true;
		}
		catch (e) {
			await interaction.editReply({content: `Le transcript n'a pas pu être envoyé. Il est conseillé d'utiliser Discord Chat Exporter (https://github.com/Tyrrrz/DiscordChatExporter) pour ce ticket.${close? "\n**Le ticket n'a pas été supprimé !**" : ""}`});
			return false;
		}
	}
}
