import {Parameters, ResultRolls, Seuil} from "../interface";
import {EmbedBuilder, userMention} from "discord.js";
import {parseResult} from "./parseArg";
import {capitalize} from "../utils";


export function ephemeralInfo(param: Parameters): string | undefined {
	if (!param.fiche && param.statistiqueName === "Neutre" && param.statistiques === 10) {
		const char = param.personnage !== "main" ? `${param.personnage} (${userMention(param.user.id)})` : userMention(param.user.id);
		return `*${char} n'a pas de fiche de personnage ! ${capitalize(param.statistiqueName)} appliquée : [${param.statistiques}]* \n_ _`;
	}
	return undefined;
}

export function displayATQ(param: Parameters, resultRoll: ResultRolls) {
	const result = parseResult(param, resultRoll, "combat");
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
	resultRoll: ResultRolls) {
	const result = parseResult(param, resultRoll, "neutre");
	const commentaire = result.commentaire ? `*${capitalize(result.commentaire)}*` : null;
	const seuil = param.seuil ? param.seuil.value : Seuil.moyen;
	const signeTotal = result.total > seuil ? "⩾" : "⩽";
	return new EmbedBuilder()
		.setAuthor({
			name: `${result.author} • ${param.seuil?.name}`,
			iconURL: result.image,
		})
		.setFooter({
			text: `[ ${result.calcul} ] `,
			iconURL: "https://imgur.com/1xGY5S1.png"
		})
		.setTitle(`${result.total} ${signeTotal} ${seuil} ${result.ccMsg.message}`)
		.setDescription(commentaire)
		.setColor(result.total > seuil ? "#33b666" : "#5e5e5e");
}
