import {ChannelType, Client} from "discord.js";
import {
	logInDev,
} from "../utils";
import {rollCombat, rollNeutre} from "../roll";
import { getParameters } from "../roll/parseArg";
import {displayATQ, displayNEUTRE, ephemeralInfo} from "../display/results";
import {exportMaps, getConfig} from "../maps";
import {helpCombat} from "../display/help";
import {dedent} from "ts-dedent";

export default (client: Client): void => {
	client.on("messageCreate", async (message) => {
		if (message.author.bot) return;
		if (message.channel.type === ChannelType.DM) return;
		if (!message.guild) return;
		if (message.content.toLowerCase().startsWith("$db") && process.env.NODE_ENV === "development") {
			const db = exportMaps();
			await message.reply(dedent(`\`\`\`json
			${db}
			\`\`\``));
			logInDev(db);
			return;
		}
		const prefix = getConfig(message.guild?.id, "prefix");
		if (message.content.toLowerCase().startsWith(`${prefix}r`)) {
			/** Parse parameters **/
			const param = getParameters(message, "neutre");
			const result = rollNeutre(param);
			if (!result?.success) return;

			const embed = displayNEUTRE(param, result, message.member);
			const info = ephemeralInfo(param);
			await message.reply({
				content: info,
				embeds: [embed]});
			return;
		} else if (message.content.toLowerCase().startsWith(`${prefix}atq`)) {
			if (message.content.toLowerCase().startsWith(`${prefix}atq --help`)) {
				await message.reply({ embeds: [helpCombat(message, "combat")] });
				return;
			}
			const param = getParameters(message, "combat");
			const result = rollCombat(param);
			if (!result) return;
			const member = message.guild?.members.cache.get(param.user) ?? message.member;
			const embed = displayATQ(param, result, member);
			const info = ephemeralInfo(param);
			await message.reply({
				content: info,
				embeds: [embed]});
			return;
		}
	});
};
