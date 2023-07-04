import {Parameters} from "../interface";
import {EmbedBuilder, GuildMember, userMention} from "discord.js";
import {logInDev} from "../utils";

export function displayResultNeutre(param: Parameters, result: {roll: number, stats: number}, success: {success: boolean, EC: boolean, RC: boolean}) {
	const EC = success.EC;
	const RC = success.RC;
	const stats = success.success;
	let successMSG = "Succès";
	if (EC) {
		successMSG = "EC";
	} else if (RC) {
		successMSG = "RC";
	} else if (!stats) {
		successMSG = "Echec";
	}
	const total = result.roll + result.stats;
	const signe = result.stats > 0 ? "+" : "";
	return successMSG + " resultat : \n" + "Roll : " + total + " (" + result.roll + signe + result.stats + ")" + "\n" + "Seuil : " + param.seuil + "\n" + "Commentaire : " + param.commentaire;
}

export function displayResultAtq(param: Parameters, result: {roll: number, stats: number}, member: GuildMember | null) {
	const ccMsg = {
		"indicatif": "",
		"message" : "",
	};
	
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

	let total = param.cc ? result.roll * 2 + result.stats + param.modificateur : result.roll + result.stats + param.modificateur;
	if (param.cc) {
		ccMsg.indicatif = "x 2";
		ccMsg.message = "• Coup-Critique ! ";
	}
	
	if (total <= 0) {
		ccMsg.message = "• Échec critique ! ";
		total = 0;
	}
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
	if (!member) return new EmbedBuilder();
	let author = param.personnage !== "main" ? param.personnage : member.displayName;
	author = `⌈${author}⌋`;
	let commentaire: string | null = param.commentaire ? param.commentaire : "";
	commentaire = commentaire.length > 0 ? commentaire : null;
	
	return new EmbedBuilder()
		.setAuthor({
			name: `${author} • ${capitalize(param.statistiqueName)}`,
			iconURL: member.user.avatarURL() ?? undefined,
		})
		.setFooter({
			text: `[ ${calculExplained} ] ${ccMsg.message}`,
			iconURL: "https://imgur.com/1xGY5S1.png"
		})
		.setTitle(`- ${total} 💖`)
		.setDescription(commentaire)
		.setColor(total > 0 ? "#14b296" : "#b21414");
	
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
