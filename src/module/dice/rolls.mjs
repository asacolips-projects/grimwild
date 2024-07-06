export default class GrimwildRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-action.hbs";

	async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
		if (!this._evaluated) await this.evaluate();

		const chatData = {
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : this.total,
			stat: this.options.stat,
			dice: this.terms[0].results,
		};

		if (this.total === 6) {
			chatData.result = 'Perfect';
		}
		else if (this.total === 5 || this.total === 4) {
			chatData.result = 'Messy';
		}
		else {
			chatData.result = 'Grim';
		}

		return renderTemplate(template, chatData);
	}
}