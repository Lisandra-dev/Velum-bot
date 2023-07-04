import Enmap from "enmap";
import {latinize, logInDev} from "./utils";
import {Statistiques } from "./interface";

/**
 * Create a new Enmap "Characters"
 * @type {Enmap}
 * @name Characters
 * @description Store all characters of all users
 * guildID:
 *  userID1: @type {Statistiques[]}
 *  userID2: @type {Statistiques[]}
 */


const characters = new Enmap({name: "Characters",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: "deep"});


/**
 * Set a value in Emaps 
 */

export function set(
	user: string,
	guildID: string,
	value: Statistiques
) {
	const userCharacters = characters.get(guildID, user) as Statistiques[];
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
		const newUser = {[user]: [value]};
		characters.set(guildID, newUser);
		logInDev(characters.get(guildID, user));
		logInDev(`Added ${user}'s main stats:`, value);
	}
}


export function get(user: string, guildID: string): Statistiques[] {
	return characters.get(guildID, user) ?? [] as Statistiques[] ;
}

export function getCharacters(user: string, guildID: string, characterName?: string): Statistiques | undefined{
	const userCharacters = characters.get(guildID, user) as Statistiques[];
	logInDev(userCharacters);
	logInDev(characters.get(guildID));
	logInDev(`getCharacters: ${user}'s characters:`, userCharacters);
	if (userCharacters) {
		return userCharacters.find((s: Statistiques) => {
			s.characterName ??= "main";
			if (!characterName) return;
			return latinize(s.characterName).toLowerCase().trim() === latinize(characterName).toLowerCase().trim();
		});
	}
	return undefined;
}

export function removeUser(user: string, guildID: string) {
	characters.delete(guildID, user);
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
		}
	} else {
		logInDev(`No characters found for ${user}`);
	} 
}

export function removeGuild(guildID: string, guildName: string) {
	//search all keys for guildID
	characters.delete(guildID);
	logInDev(`Removed ${guildName} (${guildID}) from characters`);
}

export function exportMaps() {
	return characters.export();
}

export function loadGuild(guildID: string) {
	characters.ensure(guildID, {});
	
}

export function destroyDB() {
	characters.deleteAll();
	console.log("Destroyed DB");
}
