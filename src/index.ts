import { Client, Partials } from "discord.js";
import dotenv from "dotenv";
import * as process from "process";
import * as pkg from "../package.json";
import ready from "./events/ready";
import interactionCreate from "./events/interactionCreate";
import onBotEnter from "./events/onBotEnter";

dotenv.config();

export const client = new Client({
	intents: [],
	partials: [Partials.Channel],
});

export const EMOJI = process.env.MESSAGE && process.env.MESSAGE.trim().length > 0 ? process.env.MESSAGE : "🔄";
export const VERSION = pkg.version ?? "0.0.0";


try {
	ready(client);
	onBotEnter(client);
	interactionCreate(client);
} catch (error) {
	console.error(error);
}
client.login(process.env.DISCORD_TOKEN);

