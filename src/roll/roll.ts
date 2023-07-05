import {Message} from "discord.js";
import {Parameters, PARAMS, Seuil, SEUIL_KEYS, STATISTIQUES} from "../interface";
import {
	getNeutreSuccess,
	getSeuil,
	getStatistique,
	latinize,
	logInDev,
	removeFromArguments,
	removeFromArgumentsWithString, roundUp
} from "../utils";

export function getParameters(message: Message, rollType: "neutre"|"combat") {
	let params = message.content.split(" ");
	//remove trigger
	params.shift();
	
	const param : Parameters = {
		statistiques: 10,
		statistiqueName: "Neutre",
		user: message.author.id,
		modificateur: 0,
	};
	
	if (rollType === "neutre") {
		param.seuil = getSeuil("moyen");
	} else {
		param.cc = false;
	}
	const guildID = message.guild?.id ?? "";
	const user = getUser(message, params, param);
	params = user.params;
	param.user = user.user;
	const perso = getPersonnage(params);
	params = perso.params;
	param.personnage = perso.personnage;
	param.fiche = perso.fiche;
	const statistiques = getParamStats(params, guildID, param);
	params = statistiques.params;
	param.statistiques = statistiques.param.statistiques;
	
	const commentaire = getCommentaire(params);
	params = commentaire.params;
	param.commentaire = commentaire.commentaire;
	
	if (rollType === "neutre") {
		const seuil = getSeuilInParameters(params);
		params = seuil.params;
		param.seuil = seuil.seuil;
	} else if (rollType === "combat") {
		const cc = getCC(params);
		params = cc.params;
		param.cc = cc.cc;
	}
	
	const modificateur = getModificator(params);
	params = modificateur.params;
	param.modificateur = modificateur.modificateur;
	
	if (params.length > 0 && !param.commentaire) {
		//set the rest of the message as comment
		param.commentaire = params.join(" ");
	}
	logInDev(param);
	return param;
}

function getUser(message: Message, params: string[], parameters: Parameters) {
	const isSomeoneMentionned = message.mentions.users ?? false;
	let user = parameters.user;
	if (isSomeoneMentionned) {
		logInDev(message.content);
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
	if (params.length >= 1) {
		/** search right value of statistiques **/
		const statistiquesArgs = STATISTIQUES.find( (value) => value.includes(latinize(params[0].toLowerCase()))) ?? "neutre";
		param.statistiqueName = statistiquesArgs;
		params = removeFromArgumentsWithString(params, statistiquesArgs);
		/** remove params[0] */
		params = params.slice(1);
		param.statistiques = getStatistique(param.user, guildID, statistiquesArgs, param.personnage ?? "main");
	}
	return {params, param};
}

function getCommentaire(params: string[]) {
	const commentaireFind = params.find( (value) => value.match(PARAMS.commentaire));
	let commentaire: string;
	if (params.length === 2 && !commentaireFind) {
		commentaire = params[1];
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
	if (seuilFind) {
		const seuilName = SEUIL_KEYS.find( (value) => value.includes(latinize(seuilFind.replace(PARAMS.seuil, "").toLowerCase()))) ?? "moyen";
		seuil = getSeuil(seuilName);
		params = removeFromArguments(params, PARAMS.seuil);
	}
	return {params, seuil};
}

function getModificator(params: string[]) {
	const find = params.find( (value) => value.match(PARAMS.modificateur));
	const modificateur = find ? parseInt(find) : 0;
	params = removeFromArguments(params, PARAMS.modificateur);
	return {params, modificateur};
}

export function rollNeutre(param: Parameters)
{
	if (!param.seuil) return ;
	const stats = roundUp((param.statistiques - 11)/2) + param.modificateur;
	const roll = Math.floor(Math.random() * 20) + 1;
	const result = roll + stats;
	const success = getNeutreSuccess(result, param.seuil);
	return {roll, stats, success};
}

export function rollCombat(param: Parameters) {
	if (param.cc === undefined) return ;
	const stats = roundUp((param.statistiques - 11)/2);
	const roll = Math.floor(Math.random() * 8) + 1;
	return {roll, stats};
}

function getCC(params: string[]) {
	const find = params.find( (value) => value.match(PARAMS.cc));
	const cc = !!find;
	params = removeFromArguments(params, PARAMS.cc);
	return {params, cc};
}
