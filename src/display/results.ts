import {IMAGE_STATISTIQUES, Parameters, Result, ResultRolls, Seuil} from "../interface";
import {EmbedBuilder, GuildMember, userMention} from "discord.js";
import {latinize, logInDev} from "../utils";

function criticalSuccess(param: Parameters, 
	result: {roll: number, stats: number}, 
	ccMsg:  {indicatif: string, message: string}) {

	if (param.cc) {
		ccMsg.indicatif = "x 2";
		ccMsg.message = "• Coup-Critique ! ";
	}
	const total = param.cc ? result.roll * 2 + result.stats + param.modificateur : result.roll + result.stats + param.modificateur;
	if (total <= 0) {
		ccMsg.message = "• Échec critique ! ";
	}
	return {ccMsg, total};
}

function seuilMessageSuccess(result: ResultRolls) {
	const success = result.success;
	if (success?.EC) {
		return "• Échec critique ! ";
	} else if (success?.RC) {
		return "• Réussite critique ! ";
	} else if (success?.success) {
		return "• Réussite ! ";
	} else {
		return "• Échec ! ";
	}
}

function displayResult(
	param: Parameters,
	result: ResultRolls,
	member: GuildMember | null,
	roll: "combat" | "neutre") {
	let total = 0;
	
	let ccMsg = {
		"indicatif": "",
		"message" : "",
	};
	
	if (roll === "combat") {
		const critical = criticalSuccess(param, result, ccMsg);
		ccMsg = critical.ccMsg;
		total = critical.total;
	} else {
		total = result.roll + result.stats + param.modificateur;
		ccMsg.message = seuilMessageSuccess(result);
	}
	
	const signe = {
		"modifStat" : param.modificateur + result.stats > 0 ? " + " : " - ",
		"first" : param.modificateur > result.stats ? param.modificateur : result.stats,
		"second" : param.modificateur > result.stats ? result.stats : param.modificateur,
	};
	const first = {
		"first" : signe.first,
	};
	const second = {
		"second" : signe.second !== 0 ?
			signe.second : "",
		"signe" : signe.second !== 0 ? signe.second > 0 ? "+" : "-" : "",
	};
	
	signe.modifStat = first.first !== 0 ? signe.modifStat : "";
	const secondWithoutSigne = second.second as number;
	second.second = secondWithoutSigne < 0 ? secondWithoutSigne * -1 : secondWithoutSigne;
	
	/**
	 * Template :
	 * ${result.roll} ${ccMs.indicatif} ${signe.modifStat} (${first.first}${second.signe}${second.second})
	 */

	logInDev(`first : ${first.first} | second : ${signe.second}`);
	let formula = first.first !== 0 ? ` (${first.first} ${second.signe} ${second.second})` : `${second.signe} ${second.second}`;
	
	
	/**
	 * if first.first < 0 && signe.modifStat === "-"
	 * Remove all signe
	 * The second will be always < first.first
	 * So at the end, the formula must become:
	 * - (first.first + second.second)
	 * aka remove first - and replace the second signe by +
	 */
	formula = signe.modifStat.trim() === "-" && first.first < 0 ? `(${second.second} + ${first.first * -1})` : formula;
	const calculExplained = `${result.roll} ${ccMsg.indicatif}${signe.modifStat}${formula}`;
	
	/** get member **/
	if (!member) return {} as Result;
	let author = param.personnage !== "main" ? param.personnage : member.displayName;
	author = `⌈${author}⌋`;
	let commentaire: string | null = param.commentaire ? param.commentaire : "";
	commentaire = commentaire.length > 0 ? commentaire : null;
	const imageStatistiques = IMAGE_STATISTIQUES[latinize(param.statistiqueName.toLowerCase()) as keyof typeof IMAGE_STATISTIQUES];
	
	const finalResultMessage: Result = {
		author: author,
		image: imageStatistiques,
		calcul: calculExplained,
		total: total,
		ccMsg: ccMsg,
		commentaire: commentaire,
	};
	return finalResultMessage;
}

function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export function ephemeralInfo(param: Parameters): string | undefined{
	if (!param.fiche) {
		const char = param.personnage !== "main" ? `${param.personnage} (${userMention(param.user)})` : userMention(param.user);
		return `*${char} n'a pas de fiche de personnage ! ${capitalize(param.statistiqueName)} appliquée : [10]* \n_ _`;
	}
	return undefined;
}

export function displayATQ(param: Parameters, resultRoll: ResultRolls, member: GuildMember | null) {
	const result = displayResult(param, resultRoll, member, "combat");
	return new EmbedBuilder()
		.setAuthor({
			name: `${result.author}`,
			iconURL: result.image,
		})
		.setFooter({
			text: `${result.total} [ ${result.calcul} ] ${result.ccMsg.message}`,
			iconURL: "https://imgur.com/FGT5437.png"
		})
		.setTitle(`${result.total < 0 ? 0 : "-" + result.total } 💖`)
		.setDescription(result.commentaire)
		.setColor(result.total > 0 ? "#b91111" : "#5b5d62");
}

export function displayNEUTRE(
	param: Parameters,
	resultRoll: ResultRolls,
	member: GuildMember | null) {
	const result = displayResult(param, resultRoll, member, "neutre");
	const commentaire = result.commentaire ? `*${capitalize(result.commentaire)}*` : null;
	const seuil = param.seuil ? param.seuil : Seuil.moyen;
	return new EmbedBuilder()
		.setAuthor({
			name: `${result.author}`,
			iconURL: result.image,
		})
		.setFooter({
			text: `[ ${result.calcul} ] `,
			iconURL: "https://imgur.com/1xGY5S1.png"
		})
		.setTitle(`${result.total} ${result.ccMsg.message}`)
		.setDescription(commentaire)
		.setColor(result.total > seuil ? "#33b666" : "#5e5e5e");
}
