
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