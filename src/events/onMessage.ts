import {ChannelType, Client} from "discord.js";
import {
	logInDev,
} from "../utils";
import {getParameters, rollCombat, rollNeutre} from "../roll/roll";
import {displayResultAtq, displayResultNeutre, ephemeralInfo} from "../roll/display_result";
import {exportMaps} from "../maps";

export default (client: Client): void => {
	client.on("messageCreate", async (message) => {
		if (message.author.bot) return;
		if (message.channel.type === ChannelType.DM) return;
		if (message.content.toLowerCase().startsWith("$db")) {
			const db = exportMaps();
			logInDev(db);
		}
		if (message.content.toLowerCase().startsWith("$roll")) {
			/** Parse parameters **/
			const param = getParameters(message, "neutre");
			const result = rollNeutre(param);
			logInDev(result);
			logInDev("param :", param);
			if (!result?.success) return;
			const success = result.success;
			await message.reply(displayResultNeutre(param, result, success));
			//@todo : Better display
		} else if (message.content.toLowerCase().startsWith("$atq")) {
			const param = getParameters(message, "combat");
			const result = rollCombat(param);
			if (!result) return;
			const member = message.guild?.members.cache.get(param.user) ?? message.member;
			const embed = displayResultAtq(param, result, member);
			const info = ephemeralInfo(param);
			await message.reply({
				content: info,
				embeds: [embed]});
		}
	});
};
