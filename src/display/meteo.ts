import OpenWeatherAPI, {CurrentWeather} from "openweather-api-node";
import {WEATHER} from "../index";
import {EmbedBuilder} from "discord.js";
import {capitalize, roundUp} from "../utils";
import {Hemisphere, Moon, NorthernHemisphereLunarEmoji} from "lunarphase-js";
import {meteoImage, translationMain, IMAGE_LINK, timedMessage} from "../interface";

function weatherData(city: string) {
	const weather = new OpenWeatherAPI({
		key: WEATHER,
		units: "metric",
		locationName: city,
	});
	weather.setLanguage("fr");
	return weather.getCurrent();
}

export async function getWeather(city: string, name?: string) {
	const data = await weatherData(city);
	return generateEmbed(data, name ?? city);
}

export async function channelNameGenerator(city: string = "Villefranche-sur-mer") {
	const data = await weatherData(city);
	const meteoEmoji = {
		"01" : "☀️",
		"02" : "⛅",
		"03" : "🌥️",
		"04" : "☁️",
		"09" : "🌧️",
		"10" : "🌦️",
		"11" : "⛈️",
		"13" : "🌨️",
		"50" : "🌫️"
	};
	
	const raw = data.weather.icon.raw.replace(/[dn]/, "") as keyof typeof meteoEmoji;
	const moonEmoji = Moon.lunarPhaseEmoji(undefined, {hemisphere: Hemisphere.NORTHERN}) as NorthernHemisphereLunarEmoji;
	return `${moonEmoji}·${meteoEmoji[raw]}╏Météo`;
}

export function generateEmbed(data: CurrentWeather, city: string) {
	const raw = data.weather.icon.raw.replace(/[dn]/, "") as keyof typeof meteoImage;
	const time = data.weather.icon.raw.replace(/\d{2}/, "") as "d" | "n";
	const icon = meteoImage[raw][time];
	const moon = {
		"Waxing Crescent" : `${IMAGE_LINK}/meteo/lunar-phase/waxing-crescent.png`, //🌒
		"First Quarter" : `${IMAGE_LINK}/meteo/lunar-phase/first-quarter.png`, //🌓
		"New" : `${IMAGE_LINK}/meteo/lunar-phase/new-moon.png`, //🌑
		"Waxing Gibbous" : `${IMAGE_LINK}/meteo/lunar-phase/waxing-gibbous.png`, //🌔
		"Full" : `${IMAGE_LINK}/meteo/lunar-phase/full-moon.png`, //🌕
		"Waning Gibbous" : `${IMAGE_LINK}/meteo/lunar-phase/waning-gibbous.png`, //🌖
		"Last Quarter" : `${IMAGE_LINK}/meteo/lunar-phase/third-quarter.png`, //🌗
		"Waning Crescent" : `${IMAGE_LINK}/meteo/lunar-phase/waning-crescent.png`, //🌘
	};
	const wind = convertDegToArrow(data.weather.wind.deg);
	const main = translationMain[data.weather.main as keyof typeof translationMain];
	//Get hour day
	const hour = new Date().getHours();
	const timeMessage = timedMessage[hour as keyof typeof timedMessage];
	let embed = new EmbedBuilder()
		.setThumbnail(icon)
		.setDescription(capitalize(data.weather.description))
		.setAuthor({
			name: `${city} · ${main}`,
			iconURL: moon[Moon.lunarPhase(undefined, {hemisphere: Hemisphere.NORTHERN}) as keyof typeof moon],
		})
		.setTimestamp()
		.setFooter({
			text: `Météo de ${timeMessage}`,
		})
		.addFields({
			name: "Température",
			value: `${roundUp(data.weather.temp.cur)}°C`,
			inline: true,
		},
		{
			name: "Humidité",
			value: `${data.weather.humidity}%`,
			inline: true,
		},
		{ name: "\u200A", value: "\u200A" },
		{
			name: "Vent",
			value: `${wind.arrow} ${roundUp(data.weather.wind.speed * 3.6)} km/h  ${wind.dir}`,
			inline: true,
		},
		{
			name: "Pression",
			value: `${data.weather.pressure} hPa`,
			inline: true,
		},
		{ name: "\u200A", value: "\u200A" },
		);
	if (data.weather.rain) {
		embed = embed.addFields({name: "Pluie", value: `${data.weather.rain}mm/h`, inline: true});
	}
	if (data.weather.snow) {
		embed = embed.addFields({name: "Neige", value: `${data.weather.snow}mm/h`, inline: true});
	}
	if (data.weather.clouds) {
		embed = embed.addFields({name: "Nuages", value: `${data.weather.clouds}%`, inline: true});
	}
	if (data.weather.visibility) {
		embed = embed.addFields({name: "Visibilité", value: `${roundUp(data.weather.visibility / 1000)} km`, inline: true});
	}
	if (data.weather.uvi) {
		embed = embed.addFields({name: "Indice UV", value: `${data.weather.uvi}`, inline: true});
	}
	if (time === "n") {
		embed = embed.setColor("#615192");
	} else {
		embed = embed.setColor("#65b4f5");
	}
	return embed;
}
function convertDegToArrow(deg: number) {
	const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
	const arrow = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
	return {
		dir : directions[Math.round(deg / 45) % 8],
		arrow: arrow[Math.round(deg / 45) % 8]
	};
}

