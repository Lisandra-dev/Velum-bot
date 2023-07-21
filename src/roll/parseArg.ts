import {CommandInteraction, CommandInteractionOptionResolver, GuildMember, Message, User} from "discord.js";
import {
	DEFAULT_STATISTIQUE,
	Parameters,
	PARAMS,
	Result,
	ResultRolls,
	Seuil,
	SEUIL_KEYS,
	STATISTIQUES,
	IMAGE_LINK
} from "../interface";
import {
	capitalize,
	latinise,
	logInDev,
	removeFromArguments,
	removeFromArgumentsWithString,
} from "../utils";
import {getCharacters} from "../maps";
import {hasStaffRole} from "../utils/data_check";
import {getSeuil, getStatistique} from "../utils/get";


export function getParameters(message: Message, rollType: "neutre" | "combat") {
	let messageContent = message.content.split(" ");
	//remove trigger
	messageContent.shift();
	
	const args: Parameters = {
		statistiques: 10,
		statistiqueName: "Neutre",
		user: message.author,
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
	const user = getUser(message, messageContent, args, hasStaffRole(message.member as GuildMember, guildID));
	messageContent = user.params;
	args.user = user.user;
	const perso = getPersonnage(messageContent);
	messageContent = perso.params;
	if (perso.personnage !== "main") {
		args.personnage = perso.personnage;
	}
	args.fiche = perso.fiche;

	const statistiques = getParamStats(messageContent, guildID, args);
	messageContent = statistiques.messageContent;
	args.statistiques = statistiques.args.statistiques;
	args.fiche = statistiques.args.fiche;
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
	const isSomeoneMentioned = message.mentions.users ?? false;
	let user = parameters.user;
	if (isSomeoneMentioned && staff) {
		user = message.mentions.users.first() ?? parameters.user;
		params = removeFromArgumentsWithString(params, `<@${user.id}>`);
	}
	return {params, user};
}

function getPersonnage(params: string[]) {
	const personnageFind = params.find((value) => value.match(PARAMS.personnage));
	let fiche = false;
	let personnage = "main";
	if (personnageFind) {
		personnage = personnageFind.replace(PARAMS.personnage, "");
		params = removeFromArguments(params, PARAMS.personnage);
		fiche = true;
	}
	return {params, personnage, fiche};
}

function getParamStats(messageContent: string[], guildID: string, args: Parameters) {
	const stats = getStatistique(args.user.id, guildID, "Neutre", args.personnage ?? "main");
	args.fiche = stats.fiche;
	if (messageContent.length >= 1) {
		const stat = messageContent[0];
		if (isNaN(parseInt(stat))) {
			const statistiquesArgs = STATISTIQUES.find((value) => value.includes(latinise(messageContent[0].toLowerCase())));
			args.statistiqueName = statistiquesArgs ?? "Neutre";
			const stats = getStatistique(args.user.id, guildID, statistiquesArgs ?? "Neutre", args.personnage ?? "main");
			args.statistiques = stats.modif;
			args.fiche = stats.fiche;
			messageContent = removeFromArgumentsWithString(messageContent, stat);
		} else if (noMatchInParam(messageContent[0])) {
			logInDev("no match in args", noMatchInParam(messageContent[0]));
			args.statistiques = parseInt(stat);
			args.fiche = stats.fiche;
			args.statistiqueName = "Neutre";
			messageContent = removeFromArgumentsWithString(messageContent, messageContent[0]);
		} else {
			args.statistiques = 10;
			args.statistiqueName = "Neutre";
		}
	}
	return {messageContent, args};
}

function getCommentaire(params: string[]) {
	const commentaireFind = params.find((value) => value.match(PARAMS.commentaire));
	let commentaire: string;
	if (params.length === 2 && !commentaireFind) {
		commentaire = removeAllPARAMSregex(params).length > 0 ? params[1] : "";
	} else {
		const commentaireFind = params.find((value) => value.match(PARAMS.commentaire));
		commentaire = commentaireFind ? commentaireFind.replace(PARAMS.commentaire, "") : "";
		params = removeFromArguments(params, PARAMS.commentaire);
	}
	return {params, commentaire};
}

function getSeuilInParameters(params: string[]) {
	const seuilFind = params.find((value) => value.match(PARAMS.seuil));
	let seuil = Seuil.moyen;
	let seuilName: string | undefined = "Moyen";
	if (seuilFind) {
		seuilName = SEUIL_KEYS.find((value) => value.includes(latinise(seuilFind.replace(PARAMS.seuil, "").toLowerCase())));
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
	const find = params.find((value) => value.match(PARAMS.modificateur));
	const modificateur = find ? parseInt(find) : 0;
	params = removeFromArguments(params, PARAMS.modificateur);
	return {params, modificateur};
}

function getCC(params: string[]) {
	const find = params.find((value) => value.match(PARAMS.cc));
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
	const user = options.getUser("user") && hasStaffRole(interaction.member as GuildMember, interaction.guild?.id) ? options.getUser("user") as User : interaction.user as User;
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
		statModif = charModif[latinise(stat.toLowerCase()) as keyof typeof charModif] ?? 10;
		statistiqueName = capitalize(stat);
	} else {
		statModif = parseInt(stat);
		statistiqueName = "Neutre";
	}
	const args: Parameters = {
		statistiques: statModif,
		statistiqueName: statistiqueName,
		modificateur: modificateur,
		commentaire: commentaire,
		user: user,
		fiche: fiche,
	};
	if (name !== "main") {
		args.personnage = name;
	}
	
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
	Object.values(PARAMS).forEach((value) => {
		if (value instanceof RegExp) {
			params = removeFromArguments(params, value);
		}
	});
	return params;
}

function noMatchInParam(param: string): boolean {
	return !Object.values(PARAMS).some((value) => {
		if (value instanceof RegExp) {
			return param.match(value);
		} else {
			/** value is string[] */
			value.forEach((val) => {
				if (param.match(val)) {
					return true;
				}
			});
		}
	});
}

function criticalSuccess(param: Parameters,
	result: { roll: number, stats: number },
	ccMsg: { indicatif: string, message: string }) {
	
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
	roll: "combat" | "neutre",
	member: GuildMember) {
	let total: number;
	logInDev(`param : ${JSON.stringify(result)}`);
	let ccMsg = {
		"indicatif": "",
		"message": "",
	};
	
	if (roll === "combat") {
		const critical = criticalSuccess(param, result, ccMsg);
		ccMsg = critical.ccMsg;
		total = critical.total;
	} else {
		total = result.roll + result.stats + param.modificateur;
		ccMsg.message = seuilMessageSuccess(result);
	}
	let author =authorName(member, param);
	author = `⌈${author}⌋`;
	let commentaire: string | null = param.commentaire ? param.commentaire : "";
	commentaire = commentaire.length > 0 ? commentaire : null;
	const imageStatistiques = STATISTIQUES.find(stats => latinise(param.statistiqueName.toLowerCase()) === latinise(stats.toLowerCase()));
	const finalResultMessage: Result = {
		author: author,
		image: `${IMAGE_LINK}/statistiques/${imageStatistiques}.png`,
		calcul: createFormula(param, result),
		total: total,
		ccMsg: ccMsg,
		commentaire: commentaire,
	};
	return finalResultMessage;
}

/**
 * Old version to display the result
function createNumber(param: Parameters, result: ResultRolls) {
	const second = param.modificateur > result.stats ? result.stats : param.modificateur;
	const first = param.modificateur > result.stats ? param.modificateur : result.stats;
	const number = {
		modifStat: param.modificateur + result.stats > 0 ? " + " : " - ",
		first: first,
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
	logInDev(`first : ${number.first} | second : ${number.second.value}`);
	return number as Formula;
}
 */

function createFormula(param: Parameters, result: ResultRolls) {
	/**
	 * Old version
	 const number = createNumber(param, result);
  let formula: string;
	if (number.first !== 0) {
		formula = number.second.value !== 0 ? ` (${number.first} ${number.second.signe} ${number.second.value})` : `${number.first}`;
	} else {
		formula = number.second.value !== 0 ? `${number.second.signe} ${number.second.value}` : "";
	}
	
	const rollCC = param.cc ? `(${result.roll} x 2)` : `${result.roll}`;
	formula = number.modifStat.trim() === "-" && number.first < 0 ? `(${number.second.value} + ${number.first * -1})` : formula;
	const formulaRegex = /\((\d+) - -(\d+)\)/gi;
	formula = formula.replace(formulaRegex, "($1 + $2)");
	const calculExplained = `${rollCC} ${number.modifStat}${formula}`;
	
	logInDev("calculExplained", calculExplained, "modif", number.modifStat);
	return calculExplained;
	*/
	
	/** New version
	 * Use the [roll] + [total stats + modif] formula
	 */
	const rollCC = param.cc ? `(${result.roll} × 2)` : `${result.roll}`;
	const bonusTotal = result.stats + param.modificateur;
	const bonusSigne = bonusTotal > 0 ? " + " : " ";
	return `${rollCC}${bonusSigne}${bonusTotal.toString().replace("-", " - ")}`;
}

function authorName(member: GuildMember, param: Parameters) {
	if (param.personnage) {
		return param.personnage;
	} else if (member.nickname === null) {
		return param.user.displayName ?? param.user.globalName;
	} else {
		return member.nickname;
	}
}
