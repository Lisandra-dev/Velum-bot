import Enmap from "enmap";
import { logInDev } from "./utils";
import { Characters, Statistiques } from "./interface";

const characters = new Enmap({name: "Characters"});

/**
 * Set a value in Emaps 
 */

export function set(
	user: string,
	guildID: string,
	value: Statistiques
) {
	const key = `${user}-${guildID}`; // ensure that the key is unique
	const userCharacters = characters.get(key) as Statistiques[];
	if (userCharacters) {
		const charName = value.characterName ?? "main";
		const charStats = userCharacters.find((s: Statistiques) => s.characterName === charName);
		if (charStats) {
			//replace
			const index = userCharacters.indexOf(charStats);
			userCharacters[index] = value;
			characters.set(key, userCharacters);
			logInDev(`Updated ${user}'s ${charName} stats:`, value);
		} else {
			//add
			userCharacters.push(value);
			characters.set(key, userCharacters);
			logInDev(`Added ${user}'s ${charName} stats:`, value);
		}
	} else {
		characters.set(key, [value]);
		logInDev(`Added ${user}'s main stats:`, value);
	}
}


export function get(user: string, guildID: string): Statistiques[] {
	const key = `${user}-${guildID}`; // ensure that the key is unique
	return characters.get(key) ?? [] as Statistiques[] ;
}

export function getCharacters(user: string, guildID: string, characterName?: string): Statistiques | undefined{
	const key = `${user}-${guildID}`; // ensure that the key is unique
	const userCharacters = characters.get(key) as Statistiques[];
	logInDev(userCharacters);
	logInDev(`getCharacters: ${user}'s characters:`, userCharacters);
	if (userCharacters) {
		return userCharacters.find((s: Statistiques) => s.characterName === characterName);
	}
	return undefined;
}

export function removeAll(user: string, guildID: string) {
	const key = `${user}-${guildID}`; // ensure that the key is unique
	characters.delete(key);
}
export function removeCharacter(user: string, guildID: string, chara?: string) {
	const key = `${user}-${guildID}`; // ensure that the key is unique
	const userCharacters = characters.get(key) as Statistiques[];
	if (userCharacters) {
		const charName = chara ?? "main";
		const charStats = userCharacters.find((s: Statistiques) => s.characterName === charName);
		if (charStats) {
			//replace
			const index = userCharacters.indexOf(charStats);
			userCharacters.splice(index, 1);
			characters.set(key, userCharacters);
			logInDev(`Removed ${user}'s ${charName} stats:`, charStats);
			// delete if empty
			if (userCharacters.length === 0) {
				removeAll(user, guildID);
			}
		}
	} else {
		logInDev(`No characters found for ${user}`);
	} 
}