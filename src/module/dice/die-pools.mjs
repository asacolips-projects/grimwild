export default class GrimwildDiePoolRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/die-pool-action.hbs";

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		if (!this._evaluated) await this.evaluate();

		const chatData = {
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			stat: this.options.stat,
			dice: this.dice[0].results,
			startPool: isPrivate ? "???" : "",
			endPool: isPrivate ? "???" : ""
		};

		const dropped = chatData.dice.filter((die) => die.result < 4);
		chatData.startPool = `${chatData.dice.length}d`;
		chatData.endPool = `${chatData.dice.length - dropped.length}d`;

		return renderTemplate(template, chatData);
	}
}
