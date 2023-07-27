import {CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder} from "discord.js";

import {logInDev, roundUp} from "../../utils";

export default {
	data: new SlashCommandBuilder()
		.setName("stat")
		.setDMPermission(false)
		.setDescription("Calcule pour vous la valeur apportée par une statistique")
		.addIntegerOption((option) =>
			option
				.setName("valeur")
				.setDescription("Valeur de la statistique")
				.setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("bonus")
				.setDescription("Bonus sur le jet")
				.setRequired(false)
		)
		.addIntegerOption((option) =>
			option
				.setName("malus")
				.setDescription("Malus sur le jet")
				.setRequired(false)
		),
	async execute(interaction: CommandInteraction) {
		if (!interaction.guild) return;
		const option = interaction.options as CommandInteractionOptionResolver;
		const value = option.getInteger("valeur", true);
		const bonusValue = option.getInteger("bonus") ?? 0;
		let malusValue = option.getInteger("malus") ?? 0;
		malusValue = malusValue > 0 ? -malusValue : malusValue;
		logInDev("malus", malusValue, "bonus", bonusValue);
		if (value === null) return;
		const bonus = roundUp((value - 11) / 2);
		const total = bonus + bonusValue + malusValue;
		/** wrote function to avoid code duplication */
		const msg = (value: number) => {
			if (value === 0) return "";
			return value > 0 ? ` + ${value}` : ` - ${-value}`;
		};
		const msgBonus = msg(bonusValue);
		const msgMalus = msg(malusValue);
		const resMsg = bonus < 0 ? "malus" : "bonus";
		if (bonusValue === 0 && malusValue === 0) {
			await interaction.reply(`La statistique \`${value}\` donne un **${resMsg}** de \`${bonus}\`.`);
			return;
		}
		const msgBonusMalus = total < 0 ? "malus" : "bonus";
		await interaction.reply(
			`Le **${resMsg}** de la statistique \`${value}\` est de \`${bonus}\`, avec un **${msgBonusMalus}** global de \`${total}\` \`(${bonus}${msgBonus}${msgMalus})\`.`
		);
		return;
	}
};
