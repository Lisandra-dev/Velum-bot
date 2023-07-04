import {getCharacters} from "./maps";
import {DEFAULT_STATISTIQUE, Seuil} from "./interface";

export function logInDev(...text: unknown[]) {
	const time= new Date();
	const timeString = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
	if (process.env.NODE_ENV === "development") {
		if (text.length === 1 && typeof text[0] === "string") {
			console.log(`${timeString} - ${text}`);
		} else {
			console.log(timeString, text);
		}
	}
}

export function getStatistique(userId: string, guildId: string, stat: string, charName?: string) {
	let characters = getCharacters( guildId, userId, charName);
	if (!characters) {
		characters = DEFAULT_STATISTIQUE;
	}
	const charModif = characters.stats;
	return charModif[stat as keyof typeof charModif] ?? 10;
}

export function getSeuil(seuil: string) {
	return Seuil[seuil as keyof typeof Seuil] ?? parseInt(seuil);
}

export function getNeutreSuccess(result: number, seuilValue: number) {
	return {
		"success" : result >= seuilValue,
		"EC" : result === 1,
		"RC" : result === 20
	};
}


export function roundUp(num: number): number {
	if (num >= 0) {
		return Math.ceil(num);
	} else {
		return Math.floor(num);
	}
}

export function removeFromArguments(args: string[], toRemove: RegExp) {
	return args.filter((arg) => !toRemove.test(arg));
}

export function removeFromArgumentsWithString(args: string[], toRemove: string) {
	return args.filter((arg) => arg !== toRemove);
}

export function latinize(str: string){
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
