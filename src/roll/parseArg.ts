import {CommandInteraction, CommandInteractionOptionResolver, GuildMember, Message, User} from "discord.js";
import {
	DEFAULT_STATISTIQUE,
	Parameters,
	PARAMS,
	Result,
	ResultRolls,
	Seuil,
	SEUIL_KEYS,
	STATISTIQUES
} from "../interface";
import {
	getSeuil,
	getStatistique,
	latinize,
	logInDev,
	removeFromArguments,
	removeFromArgumentsWithString
} from "../utils";
import {getCharacters, getConfig} from "../maps";
import {capitalize} from "./results";
import {IMAGE_LINK} from "../index";


export function getParameters(message: Message, rollType: "neutre"|"combat") {
	let messageContent = message.content.split(" ");
	//remove trigger
	messageContent.shift();
	
	const args : Parameters = {
		statistiques: 10,
		statistiqueName: "Neutre",
		user: message.author.id,
		modificateur: 0,
	};
	
	if (rollType === "neutre") {
		args.seuil = {
			value: Seuil.moyen,
			name: "Moyen"
		};
	} else {
		args.cc = false;
	}
	const guildID = message.guild?.id ?? "";
	const roleStaff = getConfig(guildID, "staff");
	const hasRoleStaff = message.member?.roles.cache.has(roleStaff) ?? false;
	const user = getUser(message, messageContent, args, hasRoleStaff);
	messageContent = user.params;
	args.user = user.user;
	const perso = getPersonnage(messageContent);
	messageContent = perso.params;
	args.personnage = perso.personnage;
	args.fiche = perso.fiche;
	const statistiques = getParamStats(messageContent, guildID, args);
	messageContent = statistiques.params;
	args.statistiques = statistiques.param.statistiques;
	const commentaire = getCommentaire(messageContent);
	messageContent = commentaire.params;
	args.commentaire = commentaire.commentaire;
	if (rollType === "neutre") {
		const seuil = getSeuilInParameters(messageContent);
		messageContent = seuil.params;
		args.seuil = seuil.seuilValue;
	} else if (rollType === "combat") {
		const cc = getCC(messageContent);
		messageContent = cc.params;
		args.cc = cc.cc;
	}
	const modificateur = getModifier(messageContent);
	messageContent = modificateur.params;
	args.modificateur = modificateur.modificateur;
	if (messageContent.length > 0 && !args.commentaire) {
		//set the rest of the message as comment
		//remove all other parameters
		messageContent = removeAllPARAMSregex(messageContent);
		if (messageContent.length > 0) args.commentaire = messageContent.join(" ");
	}
	logInDev(args);
	return args;
}

function getUser(message: Message, params: string[], parameters: Parameters, staff: boolean) {
	const isSomeoneMentionned = message.mentions.users ?? false;
	let user = parameters.user;
	if (isSomeoneMentionned && staff) {
		user = message.mentions.users.first()?.id ?? parameters.user;
		params = removeFromArgumentsWithString(params, `<@${parameters.user}>`);
	}
	return {params, user};
}

function getPersonnage(params: string[]) {
	const personnageFind = params.find( (value) => value.match(PARAMS.personnage));
	let fiche = false;
	let personnage = "main";
	if (personnageFind) {
		personnage = personnageFind.replace(PARAMS.personnage, "");
		params = removeFromArguments(params, PARAMS.personnage);
		fiche = true;
	}
	return {params, personnage, fiche};
}

function getParamStats(params: string[], guildID: string, param: Parameters) {
	const stats = getStatistique(param.user, guildID, "Neutre", param.personnage ?? "main");
	param.fiche = stats.fiche;
	if (params.length >= 1) {
		const stat = params[0];
		if (isNaN(parseInt(stat))) {
			const statistiquesArgs = STATISTIQUES.find((value) => value.includes(latinize(params[0].toLowerCase())));
			param.statistiqueName = statistiquesArgs ?? "Neutre";
			const stats = getStatistique(param.user, guildID, statistiquesArgs ?? "Neutre", param.personnage ?? "main");
			param.statistiques = stats.modif;
			param.fiche = stats.fiche;
		} else if (noMatchInParam(params[0])) {
			logInDev("no match in param", noMatchInParam(params[0]));
			param.statistiques = parseInt(stat);
			param.fiche = stats.fiche;
			param.statistiqueName = "Neutre";
			params = removeFromArgumentsWithString(params, params[0]);
		} else {
			param.statistiques = 10;
			param.statistiqueName = "Neutre";
		}
	}
	return {params, param};
}

function getCommentaire(params: string[]) {
	const commentaireFind = params.find( (value) => value.match(PARAMS.commentaire));
	let commentaire: string;
	if (params.length === 2 && !commentaireFind) {
		commentaire = removeAllPARAMSregex(params).length > 0 ? params[1] : "";
	} else {
		const commentaireFind = params.find( (value) => value.match(PARAMS.commentaire));
		commentaire = commentaireFind ? commentaireFind.replace(PARAMS.commentaire, "") : "";
		params = removeFromArguments(params, PARAMS.commentaire);
	}
	return {params, commentaire};
}

function getSeuilInParameters(params: string[]) {
	const seuilFind = params.find( (value) => value.match(PARAMS.seuil));
	let seuil = Seuil.moyen;
	let seuilName: string | undefined = "Moyen";
	if (seuilFind) {
		seuilName = SEUIL_KEYS.find( (value) => value.includes(latinize(seuilFind.replace(PARAMS.seuil, "").toLowerCase())));
		if (!seuilName && !isNaN(parseInt(seuilFind.replace(PARAMS.seuil, "")))) {
			seuil = parseInt(seuilFind.replace(PARAMS.seuil, ""));
			seuilName = `Seuil : ${seuil}`;
		} else {
			seuil = getSeuil(seuilName ?? "Moyen");
			seuilName = seuilName ?? "Moyen";
		}
		params = removeFromArguments(params, PARAMS.seuil);
	}
	const seuilValue =
		{
			value: seuil,
			name: seuilName ?? "Moyen"
		};
	return {params, seuilValue};
}

function getModifier(params: string[]) {
	const find = params.find( (value) => value.match(PARAMS.modificateur));
	const modificateur = find ? parseInt(find) : 0;
	params = removeFromArguments(params, PARAMS.modificateur);
	return {params, modificateur};
}

function getCC(params: string[]) {
	const find = params.find( (value) => value.match(PARAMS.cc));
	const cc = !!find;
	params = removeFromArguments(params, PARAMS.cc);
	return {params, cc};
}

export function getInteractionArgs(interaction: CommandInteraction, type: "combat" | "neutre") {
	const options = interaction.options as CommandInteractionOptionResolver;
	const stat = options.getString("statistique") || "neutre";
	const name = options.getString("alias")?.replace(/personnage principal/i, "main") ?? "main";
	const modificateur = options.getInteger("modificateur") || 0;
	const commentaire = options.getString("commentaire") || "";
	const user = interaction.user as User;
	/**
	 * the guildID is not null because the command is guild only
	 * We check the guildID before the command is executed
	 */
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-ignore
	const guildID = interaction.guild.id;
	let characters = getCharacters(user.id, guildID, name);
	let fiche = true;
	if (!characters) {
		characters = DEFAULT_STATISTIQUE;
		fiche = false;
	}
	const charModif = characters.stats;
	let statModif: number;
	let statistiqueName: string;
	if (isNaN(parseInt(stat))) {
		statModif = charModif[stat as keyof typeof charModif] ?? 10;
		statistiqueName = capitalize(stat);
	} else {
		statModif = parseInt(stat);
		statistiqueName = "Neutre";
	}
	
	const args : Parameters = {
		statistiques: statModif,
		statistiqueName: statistiqueName,
		modificateur: modificateur,
		commentaire: commentaire,
		user: user.id,
		fiche: fiche,
	};
	
	if (type === "combat") {
		args.cc = options.getBoolean("critique") || false;
	} else {
		const seuil = (options.getString("seuil"))?.toLowerCase() || "moyen";
		const seuilValue = Seuil[seuil as keyof typeof Seuil] ?? parseInt(seuil);
		args.seuil = {
			value: seuilValue,
			name: isNaN(parseInt(seuil)) ? capitalize(seuil) : `Seuil : ${seuil}`
		};
	}
	return args;
}

function removeAllPARAMSregex(params: string[]) {
	Object.values(PARAMS).forEach( (value) => {
		if (value instanceof RegExp) {
			params = removeFromArguments(params, value);
		}
	});
	return params;
}

function noMatchInParam(param: string): boolean {
	return !Object.values(PARAMS).some( (value) => {
		if (value instanceof RegExp) {
			return param.match(value);
		} else {
			/** value is string[] */
			value.forEach( (val) => {
				if (param.match(val)) {
					return true;
				}
			});
		}
	});
}

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

export function parseResult(
	param: Parameters,
	result: ResultRolls,
	member: GuildMember | null,
	roll: "combat" | "neutre") {
	let total : number;
	logInDev(`param : ${JSON.stringify(result)}`);
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
	
	const second = param.modificateur > result.stats ? result.stats : param.modificateur;
	const first = param.modificateur > result.stats ? param.modificateur : result.stats;
	const number = {
		modifStat: param.modificateur + result.stats > 0 ? " + " : " - ",
		first : first,
		second: {
			value: second !== 0 ? second : 0,
			signe: second !== 0 ? second > 0 ? "+" : "-" : ""
		}
	};
	const secondWithoutSigne = number.second.value as number;
	number.second.value = secondWithoutSigne < 0 ? secondWithoutSigne * -1 : secondWithoutSigne;
	number.first = first > number.second.value ? first : number.second.value;
	number.second.value = number.first > number.second.value ? number.second.value : first;
	number.modifStat = number.first !== 0 ? number.modifStat : "";

	/**
	 * Template :
	 * ${result.roll} ${ccMs.indicatif} ${signe.modifStat} (${first.first}${second.signe}${second.second})
	 */

	logInDev(`first : ${number.first} | second : ${number.second.value}`);
	let formula : string;
	if (number.first !== 0) {
		formula = number.second.value !== 0 ? ` (${number.first} ${number.second.signe} ${number.second.value})` : `${number.first}`;
	} else {
		formula = number.second.value !== 0 ? `${number.second.signe} ${number.second.value}` : "";
	}
	
	/**
	 * if first.first < 0 && signe.modifStat === "-"
	 * Remove all signe
	 * The second will be always < first.first
	 * So at the end, the formula must become:
	 * - (first.first + second.second)
	 * aka remove first - and replace the second signe by +
	 */
	const rollCC = param.cc ? `(${result.roll} x 2)` : `${result.roll}`;
	formula = number.modifStat.trim() === "-" && number.first < 0 ? `(${number.second.value} + ${number.first * -1})` : formula;
	const calculExplained = `${rollCC} ${number.modifStat}${formula}`;
	logInDev(`calculExplained : ${calculExplained}`, "modif", number.modifStat);
	
	/** get member **/
	if (!member) return {} as Result;
	let author = param.personnage !== "main" ? param.personnage : member.user.globalName ?? member.displayName;
	author = author ?? member.user.globalName ?? member.displayName;
	author = `⌈${author}⌋`;
	let commentaire: string | null = param.commentaire ? param.commentaire : "";
	commentaire = commentaire.length > 0 ? commentaire : null;
	const imageStatistiques = STATISTIQUES.find(stats =>latinize(param.statistiqueName.toLowerCase()) === latinize(stats.toLowerCase()));
	const finalResultMessage: Result = {
		author: author,
		image: `${IMAGE_LINK}/${imageStatistiques}.png`,
		calcul: calculExplained,
		total: total,
		ccMsg: ccMsg,
		commentaire: commentaire,
	};
	return finalResultMessage;
}

