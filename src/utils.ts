import {getCharacters, getConfig} from "./maps";
import {DEFAULT_STATISTIQUE, Seuil} from "./interface";
import {Guild, GuildMember, PermissionFlagsBits, TextBasedChannel} from "discord.js";

export function logInDev(...text: unknown[]) {
	const time= new Date();
	const timeString = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
	/** get the called function name */
	const stack = new Error().stack;
	const caller = stack?.split("\n")[2].trim().split(" ")[1];
	if (process.env.NODE_ENV === "development") {
		if (text.length === 1 && typeof text[0] === "string") {
			console.log(`${timeString} (${caller}) - ${text}`);
		} else {
			console.log(`${timeString} (${caller})`, text);
		}
	}
}

export function getStatistique(userId: string, guildId: string, stat: string, charName?: string) {
	let characters = getCharacters(userId, guildId, charName);
	let fiche = true;
	if (!characters) {
		characters = DEFAULT_STATISTIQUE;
		fiche = false;
	}
	const charModif = characters.stats;
	const modif = charModif[stat as keyof typeof charModif] ?? 10;
	return {
		modif,
		fiche};
}

export function getSeuil(seuil: string) {
	return Seuil[seuil as keyof typeof Seuil] ?? parseInt(seuil);
}

export function getNeutreSuccess(result: number, seuilValue: number, deNat: number) {
	return {
		"success" : result >= seuilValue,
		"EC" : deNat === 1,
		"RC" : deNat === 20
	};
}


export function roundUp(num: number): number {
	if (num >= 0) {
		return Math.ceil(num);
	} else {
		return Math.floor(num);
	}
}

export function removeFromArguments(args: string[], toRemove: RegExp) {
	return args.filter((arg) => !toRemove.test(arg));
}

export function removeFromArgumentsWithString(args: string[], toRemove: string | undefined) {
	if (!toRemove) return args;
	return args.filter((arg) => arg !== toRemove);
}

export function latinise(str: string){
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Check if the member has the staff role
 * @param member {@link GuildMember} Member to check
 * @param guildID {@link string} Guild ID to get the staff role
 * @returns {boolean} True if the member has the staff role
 */
export function hasStaffRole(member: GuildMember, guildID: string) : boolean {
	const staffRole = getConfig(guildID, "staff");
	const hasRole = !!member.roles.cache.find((role) => role.id === staffRole);
	return hasRole || member.permissions.has(PermissionFlagsBits.ManageRoles);
}

export function getStaff(guild: Guild) {
	const staffRole = getConfig(guild.id, "staff");
	return guild.roles.cache.find((role) => role.id === staffRole);
}

export function verifTicket(ticket: TextBasedChannel | null, guildID: string) {
	if (!ticket || ticket.isDMBased()) {
		return false;
	}
	/** verification that the ticket is in the category ticket */
	const ticketCategory = getConfig(guildID, "ticket");
	const ticketParent = ticket.parent ? ticket.parent.id : "0";
	return (ticketParent || ticketParent === ticketCategory);
}

export function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}
