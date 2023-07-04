import {Client} from "discord.js";
import {removeUser} from "../maps";
import {logInDev} from "../utils";

export default (client: Client): void => {
	client.on("guildMemberRemove", async (member) => {
		const memberID = member.id;
		const guildID = member.guild.id;
		logInDev(`Member ${memberID} left guild ${guildID}`);
		removeUser(guildID, memberID);
	});
};
