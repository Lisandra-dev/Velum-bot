import OpenWeatherAPI, {ForecastWeather} from "openweather-api-node";

import {WEATHER} from "../index";
import {ResultTodayWeather, timedMessage} from "../interface";


export function weatherAPI(city: string) {
	const weather = new OpenWeatherAPI({
		key: WEATHER,
		units: "metric",
		locationName: city,
	});
	weather.setLanguage("fr");
	return weather;
}

export function weatherCurrent(city: string) {
	const weather = weatherAPI(city);
	return weather.getCurrent();
}

export async function weatherToday(city: string) {
	const weather = weatherAPI(city);
	/** the getForecast() give the weather for the next 5 days, so we need to filter the data to get only the weather for today */
	const data = await weather.getForecast(8);
	const today = new Date().getDate();
	const todayData = data.filter((value) => new Date(value.dt).getDate() === today);
	/** we need also the history of the day for this night, aka everything of the same date and before the first dt of todayData */
	let first = todayData[0].dt;
	const timesToFetchToComplete: Date[] = [];
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
		alerts: await weather.getAlerts(),
	} as ResultTodayWeather;
}


export function convertDegToArrow(deg: number) {
	const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
	const arrow = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
	return {
		dir: directions[Math.round(deg / 45) % 8],
		arrow: arrow[Math.round(deg / 45) % 8]
	};
}

export function getTimeOfDay(hour: number) {
	for (const moment of timedMessage) {
		if (moment.hour.includes(hour)) {
			return moment.description;
		}
	}
	return "";
}


