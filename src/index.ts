import {Client, GatewayIntentBits, Partials} from "discord.js";
import dotenv from "dotenv";
import * as process from "process";
import * as pkg from "../package.json";
import ready from "./events/ready";
import interactionCreate from "./events/interactionCreate";
import onBotEnter from "./events/onBotEnter";
import onMessage from "./events/onMessage";
import onUserQuit from "./events/onUserQuit";
import onBotRemoved from "./events/onBotRemoved";

dotenv.config();

export const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	],
	partials: [
		Partials.Channel,
		Partials.GuildMember,
		Partials.User
	],
});

export const VERSION = pkg.version ?? "0.0.0";
export const DESTROY = process.env.DESTROY === "true";
export const GITHUB = pkg.repository ? pkg.repository.replace("github:", "") : "";
export const IMAGE_LINK = `https://raw.githubusercontent.com/${GITHUB}/master/images`;

try {
	ready(client);
	onBotEnter(client);
	interactionCreate(client);
	onMessage(client);
	onUserQuit(client);
	onBotRemoved(client);
} catch (error) {
	console.error(error);
}
client.login(process.env.DISCORD_TOKEN);

