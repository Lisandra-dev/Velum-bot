import Enmap from "enmap";
import {latinise, logInDev} from "./utils";
import {Statistiques, Meteo, DEFAULT_CONFIG} from "./interface";

/**
 * Create a new Enmap "Characters"
 * @type {Enmap}
 * @name Characters
 * @description Store all characters of all users
 * guildID:
 *  userID1: @type {Statistiques[]}
 *  userID2: @type {Statistiques[]}
 */


const characters: Enmap = new Enmap({
	name: "Characters",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: "deep"
});

const configuration = new Enmap({
	name: "Configuration",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: "deep"
});

/**
 * Set a value in Emaps
 */

export function set(
	user: string,
	guildID: string,
	value: Statistiques
) {
	const userCharacters = get(user, guildID);
	if (userCharacters) {
		const charName = value.characterName ?? "main";
		const charStats = userCharacters.find((s: Statistiques) => s.characterName === charName);
		if (charStats) {
			//replace
			const index = userCharacters.indexOf(charStats);
			userCharacters[index] = value;
			characters.set(guildID, userCharacters, user);
			logInDev(`Updated ${user}'s ${charName} stats:`, value);
		} else {
			//add
			userCharacters.push(value);
			characters.set(guildID, userCharacters, user);
			logInDev(`Added ${user}'s ${charName} stats:`, value);
		}
	} else {
		/**
		 * Create a new user in the map
		 * guildID: {
		 *   idUser: @type {Statistiques[]}
		 * }
		 */
		characters.set(guildID, {[user]: [value]});
		logInDev(`Added ${user}'s main stats:`, value);
	}
}

export function getConfig(guildID: string, key: string): string | string[] | Meteo {
	switch (key) {
	case "prefix":
		return configuration.ensure(guildID, "!", "prefix") as string;
	case "role.add":
		if (!(configuration.get(guildID, "role.add") instanceof Array)) {
			configuration.set(guildID, [], "role.add");
		}
		return configuration.ensure(guildID, [], "role.add") as string[];
	case "role.remove":
		if (!(configuration.get(guildID, "role.add") instanceof Array)) {
			configuration.set(guildID, [], "role.add");
		}
		return configuration.ensure(guildID, [], "role.remove") as string[];
	case "staff":
		return configuration.ensure(guildID, "", "staff") as string;
	case "ticket":
		return configuration.ensure(guildID, "", "ticket") as string;
	case "transcript" :
		return configuration.ensure(guildID, "", "transcript") as string;
	case "meteo":
		return configuration.ensure(guildID, {
			auto: false,
			channel: "",
			ville: "",
			freq: "0 0,6,12,18 * * *",
			name: "",
			forecast: {
				weekly: "",
				daily: ""
			}
		}, "meteo") as Meteo;
	default:
		return configuration.ensure(guildID, "", key);
	}
}

export function setConfig(guildID: string, key: string, value: string | boolean | Meteo) {
	configuration.set(guildID, value, key);
	logInDev(`Set: ${key} (for ${guildID}`, value);
}

export function push(guildID: string, key: string, value: string) {
	try {
		configuration.ensure(guildID, [], key);
		configuration.push(guildID, value, key, false);
	} catch (error) {
		/** delete key and retry */
		configuration.delete(guildID, key);
		configuration.ensure(guildID, [], key);
		configuration.push(guildID, value, key, false);
	}
	logInDev("Pushed", value, `to ${key} for ${guildID}`);
}

export function remove(guildID: string, key: string, value: string) {
	configuration.ensure(guildID, [], key);
	configuration.remove(guildID, value, key);
	logInDev(`Removed ${value} from ${key} for ${guildID}`);
}

export function check(guildID: string, key: string, value: string) {
	try {
		configuration.ensure(guildID, [], key);
		return configuration.get(guildID, key).includes(value);
	} catch (error) {
		/** delete key and retry */
		configuration.delete(guildID, key);
		configuration.ensure(guildID, [], key);
		return configuration.get(guildID, key).includes(value);
	}
}

export function get(user: string, guildID: string): Statistiques[] {
	try {
		return characters.get(guildID)[user] ?? [] as Statistiques[];
	} catch (error) {
		logInDev(error);
		return [] as Statistiques[];
	}
}

export function getCharacters(user: string, guildID: string, characterName?: string): Statistiques | undefined {
	try {
		const userCharacters = characters.get(guildID, user) as Statistiques[];
		if (userCharacters) {
			return userCharacters.find((s: Statistiques) => {
				if (!characterName) return;
				const name = s.characterName ?? "main";
				return latinise(name).toLowerCase().trim() === latinise(characterName).toLowerCase().trim();
			});
		}
	} catch (error) {
		logInDev(error);
	}
	return undefined;
}

export function removeUser(user: string, guildID: string) {
	try {
		characters.delete(guildID, user);
	} catch (error) {
		logInDev(error);
	}
}

export function removeCharacter(user: string, guildID: string, chara?: string) {
	const userCharacters = characters.get(guildID, user) as Statistiques[];
	if (userCharacters) {
		const charName = chara ?? "main";
		const charStats = userCharacters.find((s: Statistiques) => s.characterName === charName);
		if (charStats) {
			//replace
			const index = userCharacters.indexOf(charStats);
			userCharacters.splice(index, 1);
			characters.set(guildID, userCharacters, user);
			logInDev(`Removed ${user}'s ${charName} stats:`, charStats);
			// delete if empty
			if (userCharacters.length === 0) {
				removeUser(user, guildID);
			}
			return true;
		}
	} else {
		logInDev(`No characters found for ${user}`);
	}
	return false;
}

export function removeGuild(guildID: string, guildName: string) {
	try {
		characters.delete(guildID);
		configuration.delete(guildID);
		logInDev(`Removed ${guildName} (${guildID}) from characters`);
	} catch (error) {
		logInDev(error);
	}
}

export function exportMaps() {
	return characters.export() + "\n" + configuration.export();
}

export function loadGuild(guildID: string) {
	characters.ensure(guildID, {});
	configuration.ensure(guildID, DEFAULT_CONFIG);
}

export function destroyDB() {
	characters.deleteAll();
	configuration.deleteAll();
	console.log("Destroyed DB");
}
