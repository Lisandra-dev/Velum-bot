import {DEFAULT_STATISTIQUE, Seuil} from "../interface";
import {getCharacters} from "../maps";

export function getStatistique(userId: string, guildId: string, stat: string, charName?: string) {
	let characters = getCharacters(userId, guildId, charName);
	let fiche = true;
	if (!characters) {
		characters = DEFAULT_STATISTIQUE;
		fiche = false;
	}
	const charModif = characters.stats;
	const modif = charModif[stat as keyof typeof charModif] ?? 10;
	return {
		modif,
		fiche
	};
}

export function getSeuil(seuil: string) {
	return Seuil[seuil as keyof typeof Seuil] ?? parseInt(seuil);
}

export function getNeutreSuccess(result: number, seuilValue: number, deNat: number) {
	return {
		"success": result >= seuilValue,
		"EC": deNat === 1,
		"RC": deNat === 20
	};
}
