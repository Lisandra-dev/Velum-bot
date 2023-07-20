import AsyncWeather from "@cicciosgamino/openweather-apis";

async function getWeather(city: string) {
	const weather = new AsyncWeather({
		key: process.env.OPENWEATHER_API_KEY,
		lang: "fr",
		units: "metric",
	});
	const data = await weather.getWeatherByCityName(city);
	return data;
}