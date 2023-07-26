import dedent from "ts-dedent";
import {DailyWeather, ForecastWeather} from "openweather-api-node";
import {IMAGE_LINK, meteoImage} from "../interface";
import nodeHtmlToImage from "node-html-to-image";
import {capitalize, roundUp} from "../utils";
import {convertDegToArrow, getTimeOfDay} from "./utils";


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
	return dedent(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Météo de la semaine</title>
  <style>
     @font-face {
      font-family: 'Borel';
      src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Borel&display=swap")}') format('woff2'););
     }
     @font-face {
      font-family: 'Sniglet';
      src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Sniglet&display=swap")}') format('woff2'););
     }
     @font-face {
      font-family: 'Inter';
      src: url('${await googleFontToBase64("https://fonts.googleapis.com/css2?family=Inter&display=swap")}') format('woff2'););
     }
     body {
      display: flex;
    }

    .weather-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .day-card {
      border-radius: 10px;
      border-left: 5px solid rgba(94, 176, 206, 0.51);
      padding: 20px;
      text-align: center;
      width: ${today ? "300px" : "200px"};
    }

    .day {
      font-size: ${today ? "30px;" : "20px"};
      color: #ffffff;
      font-family: 'Borel', serif;
      background-color: rgba(94, 176, 206, 0.51);
      border-radius: 10px;
      padding-top: 10px;
      padding-bottom: 0;
    }
    
    .info-icon {
        margin-right: 5px;
    }
    .icon {
      width: 70px;
      height: 70px;
      padding-left: 30px;
    }

    .weather-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px;
    }

    .weather-info-table {
      display: grid;
      justify-content: center;
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
      ${today ? "width: 100%;\nposition: relative;\nleft: 25px;" : ""}
    }

    .weather-info-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      ${today ? "" : "margin-right: 10px;"}
      font-family: 'Inter', serif;
      font-size: ${today ? "25px" : "20px"};
      color: #ada6a6;
    }
    .wind {
    	${today ? "width: max-content" : "margin-top: -10px"};
    }
    .weather-name {
      font-size: ${today ? "30px" : "20px"};
      color: #d7d7d7;
      margin-left: 5px;
      font-family: 'Sniglet', cursive;
    }
  </style>
</head>
`);
}

export async function body(data: DailyWeather[] | ForecastWeather[], title: "today" | "week") {
	let body = dedent(`
    <body>
    <div class="weather-grid">`);
	for (const day of data) {
		const raw = day.weather.icon.raw.replace(/[dn]/, "") as keyof typeof meteoImage;
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
		if ((day as DailyWeather).weather.uvi) {
			const uviNumber = Math.round((day as DailyWeather).weather.uvi);
			uvi = dedent(`</div>
					<div class="weather-info-table">
           <div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/uv.png" alt="UV" class="info-icon">${uviNumber} UV</div>
            <div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temps-nuageux.png" alt="couverture nuageuse" class="info-icon"> ${day.weather.clouds}%</div>
          </div>
          <div class="weather-info">
          	<div class="weather-info-item wind">${convertDegToArrow(day.weather.wind.deg).arrow} ${roundUp(day.weather.wind.speed * 3.6)}km/h ${convertDegToArrow(day.weather.wind.deg).dir}</div>
          </div>`);
		} else {
			uvi = dedent(`
					<div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temps-nuageux.png" alt="couverture nuageuse" class="info-icon"> ${day.weather.clouds}%</div>
					<div class="weather-info-item wind">${convertDegToArrow(day.weather.wind.deg).arrow} ${roundUp(day.weather.wind.speed * 3.6)}km/h ${convertDegToArrow(day.weather.wind.deg).dir}</div>
			</div>`);
		}
		let dayName: string | undefined;
		if (title === "week") {
			/* day name */
			dayName = capitalize(day.dt.toLocaleDateString("fr-FR", {weekday: "long"}));
		} else {
			// give moment of day (matin, après-midi, soir, nuit)
			const momentOfDay = day.dt.getHours();
			dayName = getTimeOfDay(momentOfDay);
		}
		body += dedent(`
      <div class="day-card">
        <div class="day">${dayName}</div>
        <div class="weather-info">
          <div class="weather-info-item">
            <img class="icon" src="${icon}" alt="weather icon">
            <div class="weather-name">${capitalize(day.weather.description)}</div>
          </div>
          <div class="weather-info-table ${title}">
            <div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/temperature.png" alt="temperature" class="info-icon"> ${roundUp(temp)}°C</div>
            <div class="weather-info-item"><img src="${IMAGE_LINK}/meteo/icon/humidite.png" alt="humidité" class="info-icon"> ${day.weather.humidity}%</div>
          ${uvi}
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
	const images = await nodeHtmlToImage({
		html: await head(isToday) + body,
		transparent: true,
		quality: 100,
		type: "png"
		
	});
	return images as Buffer;
}


