import {EmbedBuilder, Message} from "discord.js";
import {dedent} from "ts-dedent";
import {getConfig} from "../maps";

export function helpCombat(message: Message) {
	if (!message.guild) return new EmbedBuilder().setTitle("Erreur").setDescription("Cette commande n'est pas disponible en message privé.");
	const staffRole = getConfig(message.guild?.id, "staff") as string;
	/** vérifie si l'utilisateur est staff */
	let staffMSG  = "";
	if (message.member?.roles.cache.has(staffRole)) {
		staffMSG = "- `@` : Mentionne un joueur pour faire un jet à sa place. (Modérateur uniquement)";
	}
	
	const charaSpe = dedent(`
	- \`&\` : Indique votre personnage.
	- \`#\` : Ajoute un commentaire. Le "#" doit être **collé** au commentaire (ex: \`#commentaire\`), voir la partie "commentaire" pour plus d'information.
	- \`+\` : Applique un bonus
	- \`-\` : Applique un malus
	- \`CC\` : Indique que le jet est un coup critique
	${staffMSG}
	`);
	
	const prefix = getConfig(message.guild?.id, "prefix") as string;
	
	return new EmbedBuilder()
		.setTitle("Aide")
		.setColor("#14b296")
		.setDescription("La commande a plusieurs syntaxes. Chaque argument de la commande peut être mis dans le désordre, sauf pour la statistique, qui doit être en premier.")
		.addFields(
			{
				name: "Recherche de statistiques",
				value: "La statistique à rechercher peut être écrite en abrégée ou en entière. Les caractères accentués sont remplacés par leur équivalent sans accent. Par exemple, `end` ou `endurance` pour `endurance`.",
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
				value: dedent(`
				- \`${prefix}atq end +2 commentaire\`
				- \`${prefix}atq &Némo +2 \`
				`)
			}
		)
		.setFooter({
			text: `Utiliser ${prefix}atq --help pour plus d'informations sur la commande atq`
		});
}
