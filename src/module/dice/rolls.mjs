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
			dice: this.dice[0].results,
			thorns: this.dice[1].results,
			assists: {},
			crit: false,
			success: 0,
			rawSuccess: 0,
			rawResult: "",
			isCut: false,
			isPrivate: isPrivate,
			hasActions: false
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

		chatData.rawSuccess = chatData.success;

		// Handle cuts.
		if (!chatData.crit && cuts.length > 0) {
			chatData.success -= cuts.length;
		}

		// Constraints.
		chatData.success = setSuccessConstraint(chatData.success);
		chatData.rawSuccess = setSuccessConstraint(chatData.rawSuccess);

		// Handle messages.
		chatData.result = successToResult(chatData.success);
		chatData.rawResult = successToResult(chatData.rawSuccess);
		chatData.isCut = chatData.success !== chatData.rawSuccess;

		// Separate assist dice from other dice
		if (this.options?.assists) {
			for (const [name, diceNum] of Object.entries(this.options.assists)) {
				const assistResults = chatData.dice.splice(diceNum * -1);
				chatData.assists[name] = assistResults;
			}
		}

		// Handle actions.
		if (chatData.result === "disaster") {
			chatData.hasActions = true;
		}

		return renderTemplate(template, chatData);
	}
}

/**
 *
 * @param success
 */
function setSuccessConstraint(success) {
	if (success < -1) {
		success = -1;
	}
	else if (success > 3) {
		success = 3;
	}
	return success;
}

/**
 *
 * @param success
 */
function successToResult(success) {
	switch (success) {
		case 3:
			return "crit";
		case 2:
			return "perfect";
		case 1:
			return "messy";
		case 0:
			return "grim";
		case -1:
			return "disaster";
		default:
			return "";
	}
}
