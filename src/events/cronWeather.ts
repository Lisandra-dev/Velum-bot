import {CronJob} from 'cron';
import {getConfig} from "../maps";
import {Meteo} from "../interface";
import {Guild, TextChannel} from "discord.js";
import {channelNameGenerator, getWeather} from "../display/meteo";
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
	const embed = await getWeather(config.ville, config.name);
	const channel = guild.channels.cache.get(config.channel) as TextChannel;
	if (!channel) return;
	await channel.send({embeds: [embed]});
	//rename channel
	const channelName = await channelNameGenerator(config.ville);
	await channel.setName(channelName);
}
