import {CronJob} from "cron";
import {getConfig} from "../maps";
import {Meteo} from "../interface";
import {EmbedBuilder, Guild, TextChannel} from "discord.js";
import {channelNameGenerator, createWeatherAsEmbed, generateTodayImage, generateWeeklyImage} from "../weather/display";
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
	let channel = guild.channels.cache.get(config.channel);
	let weekChannel = guild.channels.cache.get(config.forecast.weekly);
	let dayChannel = guild.channels.cache.get(config.forecast.daily);
	
	if (!channel) return;
	channel = channel as TextChannel;
	weekChannel = weekChannel as TextChannel ?? channel;
	dayChannel = dayChannel as TextChannel ?? channel;
	
	let embed: EmbedBuilder[];
	if (new Date().getUTCDay() === 1 && new Date().getUTCHours() === 0) {
		const week = await generateWeeklyImage(config.ville);
		const today = await generateTodayImage(config.ville);
		await weekChannel.send("# Météo de la semaine");
		for (const embed of week) {
			await weekChannel.send({files: [embed]});
		}
		await dayChannel.send({files: [today.images[0]], content: `## Météo d'aujourd'hui\n${today.alert.join("\n")}`});
		await dayChannel.send({files: [today.images[1]]});
		embed = (await createWeatherAsEmbed(config.ville, config.name)).allEmbeds;
		await channel.send({embeds: embed});
	} else if (new Date().getUTCHours() === 0) {
		const today = await generateTodayImage(config.ville);
		await dayChannel.send({files: [today.images[0]], content: `## Météo d'aujourd'hui\n${today.alert.join("\n")}`});
		await dayChannel.send({files: [today.images[1]]});
		embed = (await createWeatherAsEmbed(config.ville, config.name)).allEmbeds;
		await channel.send({embeds: embed});
	} else {
		embed = (await createWeatherAsEmbed(config.ville, config.name)).allEmbeds;
		await channel.send({embeds: embed});
	}
	const channelName = await channelNameGenerator(config.ville);
	await channel.setName(channelName);
}

