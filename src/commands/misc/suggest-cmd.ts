import config from "../../config";
import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import EmbedBuilder from "../../util/EmbedBuilder";
import Language from "../../util/Language";

export default new Command(["suggest"], __filename)
	.setBotPermissions([
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(9e5, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		if (msg.args.length < 1) return new CommandError("ERR_INVALID_USAGE", cmd);
		const [title, desc] = msg.args.join(" ").split("|").map(v => v.trim());
		if (!title) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.missingTitle`));

		const v = await this.w.get("suggestions")!.execute({
			embeds: [
				new EmbedBuilder(config.devLanguage)
					.setTitle(`Suggestion by ${msg.author.tag} from guild ${msg.channel.guild.name}`)
					.setThumbnail(msg.author.avatarURL)
					.setDescription(`${title}${desc ? `\n\n${desc}` : ""}`)
					.setFooter(`User ID: ${msg.author.id} | Guild ID: ${msg.channel.guild.id}`)
					.setTimestamp(new Date().toISOString())
					.toJSON()
			]
		});
		await v.addReaction(config.emojis.custom.upvote).catch(err => null);
		await v.addReaction(config.emojis.custom.downvote).catch(err => null);
		return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.done`, [config.client.socials.discord]));
	});
