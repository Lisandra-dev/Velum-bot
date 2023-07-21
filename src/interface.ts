import {User} from "discord.js";
import * as pkg from "../package.json";
export const GITHUB = pkg.repository ? pkg.repository.replace("github:", "") : "";
export const IMAGE_LINK = `https://raw.githubusercontent.com/${GITHUB}/master/images`;

export interface Characters {
	stats: Statistiques[];
}

export interface Statistiques {
	characterName?: string;
	stats: {
		force: number;
		constitution: number;
		agilite: number;
		intelligence: number;
		psychologie: number;
		perception: number;
	};
}

export type Meteo = {
	channel: string,
	ville: string
	auto: boolean
	frequence: string
	name: string
};

export const DEFAULT_STATISTIQUE: Statistiques = {
	stats: {
		force: 10,
		constitution: 10,
		agilite: 10,
		intelligence: 10,
		psychologie: 10,
		perception: 10
	}
};

export const Seuil = {
	trivial: 6,
	facile: 8,
	moyen: 10,
	difficile: 13,
	epique: 16,
	impossible: 20
};

export const SEUIL_KEYS = Object.keys(Seuil).map(value => value.toString());

export const STATISTIQUES = [
	"force",
	"constitution",
	"agilité",
	"intelligence",
	"psychologie",
	"perception",
	"neutre"
];

export const PREFIX = "!";

export interface Parameters {
	seuil?: {
		value: number,
		name: string
	};
	cc?: boolean;
	statistiques: number;
	statistiqueName: string;
	modificateur: number;
	commentaire?: string;
	personnage?: string;
	user: User;
	fiche?: boolean;
}

export const PARAMS = {
	"seuil": /^[><]/,
	"statistiques": STATISTIQUES,
	"modificateur": /^[+-]/,
	"commentaire": /^#/,
	"personnage": /^&/,
	"user": /^@/,
	"cc": /cc/i
};

export interface Result {
	author: string,
	image: string,
	calcul: string,
	total: number,
	ccMsg: {
		indicatif: string,
		message: string,
	},
	commentaire: string | null,
}

export interface ResultRolls {
	roll: number,
	stats: number,
	success?: {
		EC: boolean,
		RC: boolean,
		success: boolean
	}
}

type signe = {
	value: number,
	signe: string
}

export type Formula = {
	modifStat: string,
	first: number,
	second: signe,
};

const jour = `${IMAGE_LINK}/meteo/jour`;
const nuit = `${IMAGE_LINK}/meteo/nuit`;


export 	const meteoImage = {
	"01" :
			{
				d: `${jour}/soleil.png`,
				n: `${nuit}/lune.png`
			},
	"02" :
			{
				d: `${jour}/few.png`,
				n: `${nuit}/few.png`
			},
	"03" :
			{
				d: `${jour}/cloud.png`,
				n: `${jour}/cloud.png`
			},
	"04" :
			{
				d: `${jour}/clouds.png`,
				n: `${jour}/clouds.png`
			},
	"09" :
			{
				d: `${jour}/shower.png`,
				n: `${jour}/shower.png`
			},
	"10" :
			{
				d: `${jour}/rain.png`,
				n: `${nuit}/rain.png`
			},
	"11" :
			{
				d: `${jour}/thunder.png`,
				n: `${jour}/thunder.png`
			},
	"13" : {
		d: `${jour}/snow.png`,
		n: `${jour}/snow.png`
	},
	"50" : {
		d: `${jour}/mist.png`,
		n: `${jour}/mist.png`
	}
};

export const translationMain = {
	"Thunderstorm" : "Orage",
	"Drizzle" : "Bruine",
	"Rain" : "Pluie",
	"Snow" : "Neige",
	"Mist" : "Brume",
	"Smoke" : "Fumée",
	"Haze" : "Brume",
	"Dust" : "Poussière",
	"Fog" : "Brouillard",
	"Sand" : "Sable",
	"Ash" : "Cendre",
	"Squall" : "Rafale",
	"Tornado" : "Tornade",
	"Clear" : "Clair",
	"Clouds" : "Nuageux",
};

export const timedMessage = {
	6 : "la matinée",
	12 : "l'après-midi",
	18 : "la soirée",
	0 : "la nuit",
};
