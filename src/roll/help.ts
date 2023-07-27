import {EmbedBuilder, Message} from "discord.js";
import {dedent} from "ts-dedent";

import {getConfig} from "../maps";

export function helpCombat(message: Message, type: "combat" | "neutre") {
	if (!message.guild) return new EmbedBuilder().setTitle("Erreur").setDescription("Cette commande n'est pas disponible en message privé.");
	const staffRole = getConfig(message.guild?.id, "staff") as string;
	/** vérifie si l'utilisateur est staff */
	let staffMSG = "";
	if (message.member?.roles.cache.has(staffRole)) {
		staffMSG = "- `@` : Mentionne un joueur pour faire un jet à sa place. (Modérateur uniquement)";
	}
	let trivialMSG = "";
	let example = "";
	const prefix = getConfig(message.guild?.id, "prefix") as string;
	
	if (type === "combat") {
		trivialMSG = dedent(`
		- \`CC\` : Indique que le jet est un coup critique
		`);
		example = dedent(`
			- \`${prefix}atq agi +2 commentaire\`
			- \`${prefix}atq &Némo +2 \`
		`);
	} else if (type === "neutre") {
		trivialMSG = dedent(`
		- \`>\` ou \`<\` : Permet d'indiquer le seuil de réussite, voir <#1123720800449601598> pour plus d'information. Il est aussi possible d'indiquer une valeur absolue, par exemple \`10\` pour un seuil de 10 (utile pour les combats !).
		`);
		example = dedent(`
			- \`${prefix}r agi +2 >trivial commentaire\`
			- \`${prefix}r agi +2 #commentaire <20 \`
			`);
	}
	const charaSpe = dedent(`
	- \`&\` : Indique votre personnage.
	- \`#\` : Ajoute un commentaire. Le "#" doit être **collé** au commentaire (ex: \`#commentaire\`), voir la partie "commentaire" pour plus d'information.
	- \`+\` : Applique un bonus
	${trivialMSG}
	${staffMSG}
	`);
	
	
	return new EmbedBuilder()
		.setTitle("Aide")
		.setColor("#14b296")
		.setDescription("La commande a plusieurs syntaxes. Chaque argument de la commande peut être mis dans le désordre, sauf pour la statistique, qui doit être en premier.")
		.addFields(
			{
				name: "Recherche de statistiques",
				value: "La statistique à rechercher peut être écrite en abrégée ou en entière. Les caractères accentués sont remplacés par leur équivalent sans accent. Par exemple, `agi` pour agilité, et `PSY` pour psychologie.",
				inline: false
			},
			{
				name: "Caractères spéciaux",
				value: charaSpe,
				inline: false
			},
			{
				name: "Commentaire",
				value: "Le caractère `#` permet d'ajouter un commentaire à la commande. Il doit être placé accolé au commentaire. Il est facultatif dans le cas où le commentaire est après la statistique ou à la fin de la commande."
			},
			{
				name: "Exemples",
				value: example,
			}
		)
		.setFooter({
			text: `Utiliser ${prefix}atq --help pour plus d'informations sur la commande atq`
		});
}


