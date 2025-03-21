export default class GrimwildChatRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/chat-roll-action.hbs";

	constructor(formula, data, options) {
		super(formula, data, options);
		if (game.dice3d && game.settings.get("grimwild", "diceSoNiceOverride")) {
			if (!this.options.appearance) this.options.appearance = {};
			this.options.appearance.system = "grimwild";
			this.options.appearance.colorset = "grimwild-dark";
		}
	}

	get dice() {
		const fromDefault = this.options.diceDefault;
		const fromSpark = this.options.sparkUsed ?? 0;

		return fromDefault + fromSpark;
	}

	get thorns() {
		const fromDifficulty = this.options.difficulty;
		const fromMarked = this.options.isMarked ? 1 : 0;
		const fromBloodied = this.options.isBloodied ? 1 : 0;
		const fromRattled = this.options.isRattled ? 1 : 0;
		const fromVex = this.options.isVex ? 1 : 0;

		return fromDifficulty + fromMarked + fromBloodied + fromRattled + fromVex;
	}

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		const chatData = { ...this.options, rolled: false,
			isGM: game.user.isGM };
		return renderTemplate(template, chatData);
	}
}
