import {Parameters} from "../interface";
import {
	getNeutreSuccess, roundUp
} from "../utils";



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

