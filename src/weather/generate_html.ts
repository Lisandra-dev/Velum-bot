import dedent from "ts-dedent";
import { DailyWeather, ForecastWeather } from "openweather-api-node";
import {CSS, IMAGE_LINK, meteoImage} from "../interface";
import nodeHtmlToImage from "node-html-to-image";
import {capitalize, logInDev, roundUp} from "../utils";
import { convertDegToArrow, getTimeOfDay } from "./utils";
import { minify } from "html-minifier";
import * as fs from "fs";

const TodayValue : CSS = {
	wind : "width: max-content",
	weatherInfoWind: `
		\t\t.weather-info > .weather-info-item.wind {
				\t\tposition: relative;
				\t\ttop: -15px;
			\t\t}
		`,
	weatherInfo: "padding: 0 50px;",
	dayCard: "350px",
	day: "30px",
	weatherInfoTable: "width: 100%;",
	weatherInfoItem : {
		fontSize: "25px",
		marginRight: "",
	},
	weatherName: "30px",
	number: "30px",
	icon: "padding-right: 15px;"
};

const WeekValue:CSS = {
	wind : "margin-top: -10px",
	dayCard: "250px",
	day: "20px",
	weatherInfoTable: "\t\t\t",
	weatherInfoItem : {
		fontSize: "20px",
		marginRight: "\nmargin-right: 10px;",
	},
	weatherInfoWind: "",
	weatherName: "20px",
	number: "20px",
	weatherInfo: "",
	icon: "padding-left: 15px;",
};

/**
 * Convert a google font url to a base64 string
 *
 * @param url
 */
async function googleFontToBase64(url: string) {
	//note: the page fetched is a css, we need to fetch the woff2 file
	const response = await fetch(url);
	const css = await response.text();
	const woff2 = css.match(/url\((.*?)\)/)?.[1];
	if (!woff2) {
		throw new Error("Cannot find woff2 file");
	}
	const woff2Response = await fetch(woff2);
	const woff2Buffer = await woff2Response.arrayBuffer();
	const base64 = Buffer.from(woff2Buffer).toString("base64");
	return `data:font/woff2;base64,${base64}`;
}

async function head(today?: boolean) {
	let CSS = TodayValue;
	if (!today) {
		CSS = WeekValue;
	}
	return dedent(`
		<!DOCTYPE html>
		<html lang="fr">
		<head>
			<meta charset="UTF-8">
			<title></title>
			<style>
				@font-face {
					font-family: 'Fauna One';
					src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Fauna+One&display=swap")}') format('woff2'););
				}
				
				@font-face {
					font-family: 'Signika';
					src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Signika&display=swap")}') format('woff2'););
				}
				
				@font-face {
					font-family: 'Akatab';
					src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Akatab&display=swap")}') format('woff2'););
				}
				
				@font-face {
					font-family: 'Karla';
					src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Karla&display=swap")}') format('woff2'););
				}
				
				body {
					display: flex;
				}
		
				.weather-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 10px;
				}
		
				.day-card {
					border-left: 5px solid;
					border-left-color: rgba(94, 176, 206, 0.51);
					text-align: center;
					width: ${CSS.dayCard};
					background-color: rgba(0, 0, 0, 0.65);
				}
		
				.day {
					font-size: ${CSS.day};
					color: #ffffff;
					font-family: 'Fauna One', serif;
					background-color: rgba(94, 176, 206, 0.51);
					padding-top: 10px;
					padding-bottom: 10px;
				}
				
				.info-icon {
					margin-right: 5px;
				}
				.icon {
					width: 70px;
					height: 70px;
					${CSS.icon}
				}
		
				.weather-info {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin-top: 20px;
					${CSS.weatherInfo}
				}
		
				.weather-info-table {
					display: grid;
					justify-content: center;
					gap: 10px;
					grid-template-columns: repeat(2, 1fr);
					margin-top: 10px;
					${CSS.weatherInfoTable}}
		
				.weather-info-item {
					display: flex;
					align-items: center;
					margin-bottom: 10px;
					font-family: 'Signika', sans-serif;
					font-size: ${CSS.weatherInfoItem.fontSize};
					color: #ffffff;${CSS.weatherInfoItem.marginRight}
				}
				
				.wind {
					${CSS.wind};
				}
				${CSS.weatherInfoWind}
				.weather-name {
					font-size: ${CSS.weatherName};
					color: #ffffff;
					margin-left: 5px;
					font-family: 'Akatab', sans-serif;
				}
				
				.day.Soir {
					background-color: #c7154a;
				}
				
				.day-card.Soir {
					border-left-color: #c7154a;
				}
				
				.day.Nuit {
					background-color: #065393;
				}
				
				.day-card.Nuit {
					border-left-color: #065393;
				}
				
				.weather-info-table.today.not-uvi {
					column-gap: 15%;
				}
				
				.day.Matin {
					background-color: #f4a460;
				}
				
				.day-card.Matin {
					border-left-color: #f4a460;
				}
				
				.number {
					font-family: 'Karla', sans-serif;
					font-size: ${CSS.number};
					position: relative;
					top: -3px;
				}
				
			.table-container {
				margin: auto;
			}
			
			.table-container .not-uvi {
				margin: 5%;
			}
			
			</style>
		</head>
	`);
}

export async function body(
	data: DailyWeather[] | ForecastWeather[],
	title: "today" | "week"
) {
	let body = dedent(`
		<body>
		<div class="weather-grid">`);
	//let dayNameHTML = "";
	for (const day of data) {
		const raw = day.weather.icon.raw.replace(
			/[dn]/,
			""
		) as keyof typeof meteoImage;
		const time = day.weather.icon.raw.replace(/\d{2}/, "") as "d" | "n";
		const icon = meteoImage[raw][time];
		let temp: number;
		//if data is CurrentConditions
		if ((day as DailyWeather).weather.temp.day) {
			temp = (day as DailyWeather).weather.temp.day;
		} else {
			temp = (day as ForecastWeather).weather.temp.cur;
		}
		let uvi: string | undefined;
		let isUvi = "not-uvi";
		if ((day as DailyWeather).weather.uvi) {
			isUvi = "is-uvi";
			const uviNumber = Math.round((day as DailyWeather).weather.uvi);
			uvi = dedent(`
				</div>
					<div class="weather-info-table">
						<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/uv.png" alt="UV" class="info-icon"> <span class="number">${uviNumber}</span> UV</div>
						<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temps-nuageux.png" alt="couverture nuageuse" class="info-icon"> <span class="number">${day.weather.clouds}</span>%</div>
					</div>
					<div class="weather-info">
						<div class="weather-info-item wind">${convertDegToArrow(day.weather.wind.deg).arrow} <span class="number">${roundUp(day.weather.wind.speed * 3.6)}</span>km/h ${convertDegToArrow(day.weather.wind.deg).dir}</div>
					</div>`);
		} else {
			uvi = dedent(`

					<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temps-nuageux.png" alt="couverture nuageuse" class="info-icon"> <span class="number">${day.weather.clouds}</span>%</div>
					<div class="weather-info-item wind">${convertDegToArrow(day.weather.wind.deg).arrow} <span class="number">${roundUp(day.weather.wind.speed * 3.6)}</span>km/h ${convertDegToArrow(day.weather.wind.deg).dir}</div>
				</div>
		`);
		}
		let dayName: string | undefined;
		if (title === "week") {
			/* day name */
			dayName = capitalize(
				day.dt.toLocaleDateString("fr-FR", { weekday: "long" })
			);
		} else {
			// give moment of day (matin, après-midi, soir, nuit)
			const momentOfDay = day.dt.getHours() ?? new Date().getHours();
			dayName = getTimeOfDay(momentOfDay);
		}
		body += dedent(`
			<div class="day-card ${dayName}">
				<div class="day ${dayName.replaceAll(" ", "-")}">${dayName}</div>
				<div class="weather-info">
					<div class="weather-info-item">
						<img class="icon" src="${icon}" alt="weather icon">
						<div class="weather-name">${capitalize(day.weather.description)}</div>
					</div>
					<span class="table-container">
						<div class="weather-info-table ${title} ${isUvi}">
							<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temperature.png" alt="temperature" class="info-icon"> <span class="number">${roundUp(temp)}</span>°C</div>
							<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/humidite.png" alt="humidité" class="info-icon"> <span class="number">${day.weather.humidity}</span>%</div>
							${uvi}
					</span>
				</div>
			</div>
		`);
	}
	body += dedent(`
			</div>
		</body>
		</html>
	`);
	const isToday = title === "today";
	const html = minify((await head(isToday)) + body);
	writeHTMLForDev(title, data, html);
	const images = await nodeHtmlToImage({
		html: html,
		transparent: true,
		quality: 100,
		type: "png",
	});
	return images as Buffer;
}

function writeHTMLForDev(title: "today" | "week", data: DailyWeather[] | ForecastWeather[], html: string) {
	if (process.env.NODE_ENV === "development") {
		const dayName = data.map((day) => {
			if (title === "week") {
				return capitalize(
					day.dt.toLocaleDateString("fr-FR", {weekday: "long"})
				);
			} else {
				const momentOfDay = day.dt.getHours() ?? new Date().getHours();
				return getTimeOfDay(momentOfDay);
			}
		});
		logInDev(`Writing html for ${title}/${dayName.join("-")}.html`);
		fs.writeFileSync(`html/${title}/${dayName.join("-")}.html`, html);
	}
}
