import {EmbedBuilder, GuildMember, userMention} from "discord.js";

import {Parameters, Result, ResultRolls} from "../interface";
import {capitalize} from "../utils";
import {parseResult} from "./parseArg";


export function ephemeralInfo(param: Parameters): string {
	if (!param.fiche && param.statistiqueName === "Neutre" && param.statistiques === 10) {
		const char = param.personnage !== "main" ? `${param.personnage} (${userMention(param.user.id)})` : userMention(param.user.id);
		return `*${char} n'a pas de fiche de personnage ! ${capitalize(param.statistiqueName)} appliquée : [${param.statistiques}]* \n_ _`;
	}
	return "";
}

export function displayATQ(param: Parameters, resultRoll: ResultRolls, member: GuildMember) {
	const result = parseResult(param, resultRoll, "combat", member);
	return new EmbedBuilder()
		.setAuthor({
			name: `${result.author}`,
			iconURL: result.image,
		})
		.setFooter({
			text: `${result.total} [ ${result.calcul} ] ${result.ccMsg.message}`,
			iconURL: "https://imgur.com/FGT5437.png"
		})
		.setTitle(`${result.total < 0 ? 0 : "-" + result.total} 💖`)
		.setDescription(result.commentaire)
		.setColor(result.total > 0 ? "#b91111" : "#5b5d62");
}

export function displayNEUTRE(
	param: Parameters,
	resultRoll: ResultRolls,
	member: GuildMember) {
	const result = parseResult(param, resultRoll, "neutre", member);
	const commentaire = result.commentaire ? `*${capitalize(result.commentaire)}*` : null;
	const seuil = param.seuil ? param.seuil.value : 0;
	return new EmbedBuilder()
		.setAuthor({
			name: `${result.author} ${param?.seuil && param.seuil.name.length > 0 ? `• ${capitalize(param.seuil?.name)}` : ""}`,
			iconURL: result.image,
		})
		.setFooter({
			text: `[ ${result.calcul} ]`,
			iconURL: "https://imgur.com/1xGY5S1.png"
		})
		.setTitle(titleSigne(seuil, resultRoll, result))
		.setDescription(commentaire)
		.setColor(colorBySuccessAction(result, seuil, resultRoll));
}

function titleSigne(seuil: number, roll: ResultRolls, result: Result) {
	if (seuil === 0) {
		if (roll.roll === 1) {
			return `${result.total} ${result.ccMsg.message}`;
		} else if (roll.roll === 20) {
			return `${result.total} ${result.ccMsg.message}`;
		}
		return `${result.total}`;
	}
	const signeTotal = result.total > seuil ? "⩾" : "⩽";
	return `${result.total} ${signeTotal} ${seuil} ${result.ccMsg.message}`;
}

function colorBySuccessAction(result: Result, seuil: number, roll: ResultRolls) {
	if (seuil === 0 && roll.roll > 1) {
		return "#4256b7";
	} else if (roll.roll === 1) {
		return "#c72727";
	} else if (roll.roll === 20) {
		return "#3ed1e5";
	}
	return result.total > seuil ? "#33b666" : "#524d4d";
}

