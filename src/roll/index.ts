import {Parameters, ResultRolls} from "../interface";
import {
	getNeutreSuccess, roundUp
} from "../utils";



export function rollNeutre(param: Parameters)
{
	if (!param.seuil) return {} as ResultRolls;
	const stats = roundUp((param.statistiques - 11)/2);
	const roll = Math.floor(Math.random() * 20) + 1;
	const result = roll + stats;
	const success = getNeutreSuccess(result + param.modificateur, param.seuil.value, roll);
	return {roll, stats, success} as ResultRolls;
}

export function rollCombat(param: Parameters) {
	if (param.cc === undefined) return {} as ResultRolls;
	const stats = roundUp((param.statistiques - 11)/2);
	const roll = Math.floor(Math.random() * 8) + 1;
	return {roll, stats} as ResultRolls;
}

