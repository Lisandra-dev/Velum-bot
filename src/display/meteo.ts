import OpenWeatherAPI, {Alert, DailyConditions, ForecastWeather} from "openweather-api-node";
import {DEEPL, WEATHER} from "../index";
import {EmbedBuilder} from "discord.js";
import {capitalize, roundUp} from "../utils";
import {Hemisphere, Moon, NorthernHemisphereLunarEmoji} from "lunarphase-js";
import {IMAGE_LINK, meteoImage, ResultTodayWeather, ResultWeather, timedMessage, translationMain} from "../interface";
import {CurrentConditions} from "openweather-api-node/dist/types/weather/current";
import * as deepl from "deepl-node";
import {body} from "./meteo-html";


function weatherAPI(city: string) {
	const weather = new OpenWeatherAPI({
		key: WEATHER,
		units: "metric",
		locationName: city,
	});
	weather.setLanguage("fr");
	return weather;
}

function weatherCurrent(city: string) {
	const weather = weatherAPI(city);
	return weather.getCurrent();
}

async function weatherToday(city: string) {
	const weather = weatherAPI(city);
	/** the getForecast() give the weather for the next 5 days, so we need to filter the data to get only the weather for today */
	const data = await weather.getForecast(8);
	const today = new Date().getDate();
	const todayData = data.filter((value) => new Date(value.dt).getDate() === today);
	/** we need also the history of the day for this night, aka everything of the same date and before the first dt of todayData */
	let first = todayData[0].dt;
	const timesToFetchToComplete:Date[] = [];
	while (first.getDate() === today) {
		/** remove three hours to the first hour */
		const newDate = new Date(first);
		newDate.setHours(newDate.getHours() - 3);
		if (newDate.getDate() === today) {
			timesToFetchToComplete.push(newDate);
		}
		first = newDate;
	}
	const history = await Promise.all(timesToFetchToComplete.map((value) => weather.getHistory(value)));
	const forecast = todayData.concat(...history as unknown as ForecastWeather[])
		.sort((a, b) => a.dt.getTime() - b.dt.getTime())
		.filter((value) => {
			return value.dt.getUTCHours() % 6 === 0;
		});
	// ajouter les history à todayData
	return {
		today: forecast,
		alerts : await weather.getAlerts(),
	} as ResultTodayWeather;
}

export async function embedAlerts(alert: Alert[]) {
	const contentAlert: string[] = [];
	for (const value of alert) {
		const translator = new deepl.Translator(DEEPL);
		const translated = await translator.translateText(value.event, "en", "fr");
		contentAlert.push(`⚠️ **${translated.text}**\n*Du <t:${value.start}:d> au <t:${value.end}:d>*`);
	}
	return contentAlert;
}

export async function getWeather(city: string, name?: string) {
	const data = await weatherCurrent(city);
	const alerts = (await weatherAPI(city).getAlerts()).filter((value, index, self) => {
		return self.findIndex((v) => v.event === value.event) === index;
	});
	const alert = await embedAlerts(alerts);
	const embed = generateEmbed(data.weather, name ?? city, new Date());
	return {
		allEmbeds: [embed],
		alert: alert
	} as ResultWeather;
}

export async function channelNameGenerator(city: string = "Villefranche-sur-mer") {
	const data = await weatherCurrent(city);
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

export function generateEmbed(data: CurrentConditions | DailyConditions, city: string, momentOfDay?: Date, setDayName?: string) {
	const raw = data.icon.raw.replace(/[dn]/, "") as keyof typeof meteoImage;
	const time = data.icon.raw.replace(/\d{2}/, "") as "d" | "n";
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
	const wind = convertDegToArrow(data.wind.deg);
	const main = translationMain[data.main as keyof typeof translationMain];
	//Get hour day
	let temp: number;
	//if data is CurrentConditions
	if ((data as CurrentConditions).temp.cur) {
		temp = (data as CurrentConditions).temp.cur;
	} else {
		temp = (data as DailyConditions).temp.day;
	}
	let momentAuthor : string | undefined = city;
	if (!setDayName) {
		momentAuthor = getTimeOfDay(momentOfDay?.getHours() ?? new Date().getHours());
	} else {
		momentAuthor = setDayName;
	}
	let embed = new EmbedBuilder()
		.setThumbnail(icon)
		.setDescription(capitalize(data.description))
		.setAuthor({
			name: `${momentAuthor} · ${main}`,
			iconURL: moon[Moon.lunarPhase(undefined, {hemisphere: Hemisphere.NORTHERN}) as keyof typeof moon],
		})
		.addFields({
			name: "Température",
			value: `${roundUp(temp)}°C`,
			inline: true,
		},
		{
			name: "Humidité",
			value: `${data.humidity}%`,
			inline: true,
		},
		{ name: "\u200A", value: "\u200A" },
		{
			name: "Vent",
			value: `${wind.arrow} ${roundUp(data.wind.speed * 3.6)} km/h  ${wind.dir}`,
			inline: true,
		},
		{
			name: "Pression",
			value: `${data.pressure} hPa`,
			inline: true,
		},
		{ name: "\u200A", value: "\u200A" },
		);
	if (data.rain) {
		embed = embed.addFields({name: "Pluie", value: `${data.rain}mm/h`, inline: true});
	}
	if (data.snow) {
		embed = embed.addFields({name: "Neige", value: `${data.snow}mm/h`, inline: true});
	}
	if (data.clouds) {
		embed = embed.addFields({name: "Nuages", value: `${data.clouds}%`, inline: true});
	}
	if ((data as CurrentConditions).visibility) {
		const visibility = (data as CurrentConditions).visibility;
		embed = embed.addFields({name: "Visibilité", value: `${roundUp(visibility / 1000)} km`, inline: true});
	}
	if (data.uvi) {
		embed = embed.addFields({name: "Indice UV", value: `${data.uvi}`, inline: true});
	}
	if (time === "n") {
		embed = embed.setColor("#615192");
	} else {
		embed = embed.setColor("#65b4f5");
	}
	return embed;
}
export function convertDegToArrow(deg: number) {
	const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
	const arrow = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
	return {
		dir : directions[Math.round(deg / 45) % 8],
		arrow: arrow[Math.round(deg / 45) % 8]
	};
}

export function getTimeOfDay(hour: number) {
	for (const moment of timedMessage) {
		if (moment.hour.includes(hour)) {
			return moment.description;
		}
	} return "";
}

export async function weeklyWeather(city: string) {
	const weather = weatherAPI(city);
	const data = await weather.getDailyForecast(8, true);
	//convert dailyWeather[] to DailyConditions[]
	return [
		await body(data.slice(0, 3), 1, "week"),
		await body(data.slice(3, 6), 2, "week"),
		await body(data.slice(6, 8), 3, "week"),
	];
}

export async function todayWeather(city: string) {
	const data = await weatherToday(city);
	const allEmbeds: ForecastWeather[] = [];
	//prevent duplicate data.alerts.event
	const alerts = data.alerts.filter((value, index, self) => {
		return self.findIndex((v) => v.event === value.event) === index;
	});
	for (const hour of data.today) {
		const now = new Date().getHours();
		if (now >= hour.dt.getUTCHours() && now < hour.dt.getUTCHours() + 6) {
			const currentWeather = await weatherCurrent(city);
			allEmbeds.push(currentWeather as unknown as ForecastWeather);
		} else {
			allEmbeds.push(hour);
		}
	}
	const alert = await embedAlerts(alerts);
	const allImages = [
		await body(allEmbeds.slice(0, 2), 12, "today"),
		await body(allEmbeds.slice(2), 18, "today"),];
	return {images: allImages, alert: alert};
}
