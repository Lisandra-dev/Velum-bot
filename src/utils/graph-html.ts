import {ChartJSNodeCanvas} from "chartjs-node-canvas";
import {AttachmentBuilder} from "discord.js";
import path from "path";

import {getCharacters} from "../maps";
import {capitalize} from "./index";

export async function chart(user: string, guild: string, chara?: string, lineColor?: string, fillColor?: string) {
	const stat = getCharacters(user, guild, chara);
	if (!stat) return;
	if (!lineColor) lineColor = "rgb(14,71,178)";
	if (!fillColor) fillColor = "rgba(27,137,204,0.2)";
	// for data, we need list of stats and number
	const data = {
		labels: Object.keys(stat.stats).map((key) => {
			if (key === "agilite") return "Agilité";
			return capitalize(key);
		}),
		datasets: [{
			data: Object.values(stat.stats),
			fill: true,
			backgroundColor: fillColor,
			borderColor: lineColor,
		}]
	};
	const steps = 4;
	const gridColor: string[] = [];
	for (let i = 0; i < steps + 1; i++) {
		if (i === steps) {
			gridColor.push("darkgrey");
		} else {
			gridColor.push("transparent");
		}
	}
	const options = {
		elements: {
			line: {
				borderWidth: 1,
				tension: 0,
			},
				
		},
		scales: {
			r: {
				angleLines: {
					color: "darkgrey",
					display: true,
					borderDash: [5, 5],
					borderDashOffset: 0.1,
				},
				grid: {
					color: gridColor,
					circular: true,
					tickBorderDash: [5, 5],
				},
				ticks: {
					stepSize: steps,
					display: true,
					color: "darkgrey",
					backdropColor: "transparent",
					showLabelBackdrop: true,
					font: {
						size: 16,
						weight: "700",
					},
				},
				pointLabels: {
					color: "darkgrey",
					font: {
						size: 20,
						family: "'Jost'",
						weight: "700",
					},
				},
				suggestedMin: 0,
				suggestedMax: 20
			},
				
		},
		plugins: {
			legend: {
				display: false,
			},
			labels: {
				render: "value",
				fontColor: "darkgrey",
				precision: 0,
				filter: (value: number) => value === 20,
			}
		},
	};
	
	const renderer = new ChartJSNodeCanvas({ width: 400, height: 400});
	const fontPath = path.resolve(__dirname, "../../assets/fonts/Jost-Regular.ttf");
	renderer.registerFont(fontPath, {family: "Jost"});

	return await renderer.renderToBuffer({
		type: "radar",
		data: data,
		options: options,
	});
}

export async function imageChar(user: string, guild: string, chara?: string, lineColor?: string, fillColor?: string) {
	const charGraph = await chart(user, guild, chara, lineColor, fillColor);
	if (!charGraph) return;
	return new AttachmentBuilder(charGraph);
}

