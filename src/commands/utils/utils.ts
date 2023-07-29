import { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver, PermissionFlagsBits } from "discord.js";
import { roundUp } from "../../utils";

export default {
    data: new SlashCommandBuilder()
        .setName("utils")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDescription("Commandes utilitaires pour les MJ")
        .addSubcommand((subcommand) => subcommand
            .setName("pc")
            .setDescription("Calcule les PC pour une compétence")
            .addIntegerOption((option) => option
                .setName("modifier")
                .setDescription("Nombre d'effet de la compétence")
                .setRequired(true)
            )
            .addIntegerOption((option) => option
                .setName("temps")
                .setDescription("Durée du modifier")
                .setRequired(false)
            )
            .addBooleanOption((option) => option
                .setName("personnel")
                .setDescription("Est-ce que le modifier est personnel ?")
                .setRequired(false)
            )
            .addBooleanOption((option) => option
                .setName("gratuite")
                .setDescription("Est-ce que l'action est gratuite ?")
                .setRequired(false)
            )
        ),
    async execute(interaction: CommandInteraction) {
        let pool: number = 0;
        const options = interaction.options as CommandInteractionOptionResolver;
        const modifier = options.getInteger("modifier", true);
        const temps = options.getInteger("temps", false) ?? 1;
        let param: string[] = [];
        if (options.getBoolean("personnel", false)) {
            pool++;
            param.push( "**personnel**");
        }
        if (options.getBoolean("gratuite", false)) {
            pool++;
            param.push("**gratuite**");
        }
        const formula = roundUp( (modifier * temps) /2 ) + pool;

        await interaction.reply(`Le nombre de PC "optimal" pour cette compétence ${param.join(" et ")} est de ${formula} PC`)
    }
}