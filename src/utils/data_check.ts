import {GuildMember, PermissionFlagsBits} from "discord.js";

import {getConfig} from "../maps";

/**
 * Check if the member has the staff role
 * @param member {@link GuildMember} Member to check
 * @param guildID {@link string} Guild ID to get the staff role
 * @returns {boolean} True if the member has the staff role
 */
export function hasStaffRole(member: GuildMember, guildID?: string): boolean {
	if (!guildID) {
		return false;
	}
	const staffRole = getConfig(guildID, "staff");
	const hasRole = !!member.roles.cache.find((role) => role.id === staffRole);
	return hasRole || member.permissions.has(PermissionFlagsBits.ManageRoles);
}
