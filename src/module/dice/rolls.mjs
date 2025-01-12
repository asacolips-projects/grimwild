export default class GrimwildRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-action.hbs";

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		if (!this._evaluated) await this.evaluate();

		const chatData = {
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "?" : this.total,
			stat: this.options.stat,
			dice: this.dice[0].results,
			thorns: this.dice[1].results,
			crit: false,
			success: 0
		};

		const sixes = chatData.dice.filter((die) => die.result === 6);
		const cuts = chatData.thorns.filter((die) => die.result >= 7);

		const diceTotal = this.dice[0].total;

		// Handle initial results.
		if (diceTotal === 6) {
			chatData.success = 2;

			if (sixes.length > 1) {
				chatData.crit = true;
				chatData.success = 3;
			}
		}
		else if (diceTotal === 5 || diceTotal === 4) {
			chatData.success = 1;
		}
		else {
			chatData.success = 0;
		}

		// Handle cuts.
		if (!chatData.crit && cuts.length > 0) {
			chatData.success -= cuts.length;
		}

		// Constraints.
		if (chatData.success < -1) {
			chatData.success = -1;
		}
		else if (chatData.success > 3) {
			chatData.success = 3;
		}

		// Handle messages.
		switch (chatData.success) {
			case 3:
				chatData.result = "crit";
				break;
			case 2:
				chatData.result = "perfect";
				break;
			case 1:
				chatData.result = "messy";
				break;
			case 0:
				chatData.result = "grim";
				break;
			case -1:
				chatData.result = "disaster";
				break;

			default:
				break;
		}

		return renderTemplate(template, chatData);
	}
}
