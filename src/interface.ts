import {User} from "discord.js";

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
