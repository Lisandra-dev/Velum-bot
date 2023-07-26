import {CronJob} from "cron";
import {getConfig} from "../maps";
import {Meteo} from "../interface";
import {EmbedBuilder, Guild, TextChannel} from "discord.js";
import {channelNameGenerator, getWeather, todayWeather, weeklyWeather} from "../display/meteo";
import {isValidCron} from "cron-validator";

export async function autoWeather(guild: Guild) {
	const config = getConfig(guild.id, "meteo") as Meteo;
	if (!config.auto || !isValidCron(config.frequence) || config.channel.length === 0 || config.ville.length === 0) return;
	const job = new CronJob(
		config.frequence,
		() => {
			sendWeather(config, guild);
		}
	);
	job.start();
}

async function sendWeather(config: Meteo, guild: Guild) {
	/* si le moment d'envoie est le lundi à minuit, on envoie la météo de la semaine + de la journée prévue */
	const channel = guild.channels.cache.get(config.channel) as TextChannel;
	if (!channel) return;
	let embed: EmbedBuilder[];
	if (new Date().getUTCDay() === 1 && new Date().getUTCHours() === 0) {
		const week = await weeklyWeather(config.ville);
		const today = await todayWeather(config.ville);
		await channel.send("# Météo de la semaine");
		for (const embed of week) {
			await channel.send({files: [embed]});
		}
		await channel.send({files: [today.images[0]], content: `## Météo d'aujourd'hui\n${today.alert.join("\n")}`});
		await channel.send({files: [today.images[1]]});
	} else if (new Date().getUTCHours() === 0) {
		const today = await todayWeather(config.ville);
		await channel.send({files: [today.images[0]], content: `## Météo d'aujourd'hui\n${today.alert.join("\n")}`});
		await channel.send({files: [today.images[1]]});
	} else {
		embed = (await getWeather(config.ville, config.name)).allEmbeds;
		await channel.send({embeds: embed});
	}
	const channelName = await channelNameGenerator(config.ville);
	await channel.setName(channelName);
}

