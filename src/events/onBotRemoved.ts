import {Client} from "discord.js";

import {removeGuild} from "../maps";
import {logInDev} from "../utils";

export default (client: Client): void => {
	client.on("guildDelete", async (guild) => {
		removeGuild(guild.id, guild.name);
		logInDev(`Bot removed from ${guild.name} (${guild.id})`);
	});
};
