
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
	trivial : 6,
	facile : 8,
	moyen : 10,
	difficile : 13,
	epique : 16,
	impossible : 20
};

export const SEUIL_KEYS = Object.keys(Seuil).map(value => value.toString());

export const STATISTIQUES = [
	"force",
	"constitution",
	"agilité",
	"intelligence",
	"psychologie",
	"perception"];

export const PREFIX = "!";

export interface Parameters {
	seuil?: number;
	cc?: boolean;
	statistiques: number;
	statistiqueName: string;
	modificateur: number;
	commentaire?: string;
	personnage?: string;
	user: string;
	fiche?: boolean;
}

export const PARAMS = {
	"seuil" : /^[><]/,
	"statistiques" : STATISTIQUES,
	"modificateur" : /^[+-]/,
	"commentaire" : /^#/,
	"personnage" : /^&/,
	"user" : /^@/,
	"cc" : /cc/i
};

export const IMAGE_STATISTIQUES  = {
	force: "https://imgur.com/I5cCHxJ.png",
	constitution: "https://imgur.com/Fnf40Oh.png",
	agilite: "https://imgur.com/dZDgdsa.png",
	intelligence: "https://imgur.com/s8fYsGq.png",
	psychologie: "https://imgur.com/cm34dpb.png",
	perception: "https://imgur.com/BJEhRog.png",
	neutre: "https://imgur.com/KRwpRxR.png"
};
