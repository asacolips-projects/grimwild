// @TODO make this actually work.
export default class GrimwildCrucibleRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-crucible.hbs";

	constructor(formula, data, options) {
		super(formula, data, options);
		if (game.dice3d && game.settings.get("grimwild", "diceSoNiceOverride")) {
			if (!this.options.appearance) this.options.appearance = {};
			this.options.appearance.system = "grimwild";
			this.options.appearance.colorset = "grimwild-dark";
		}

		if (!this.options.crucible) {
			throw new Error(`A crucible object must be supplied in options.crucible for this roll.`);
		}
	}

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		if (!this._evaluated) await this.evaluate();
		const dice = this.dice[0].results;

		const chatData = {
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			stat: this.options.stat,
			dice: dice,
			name: this.options.crucible?.name ?? 'Crucible',
      crucible: {
        0: this.options.crucible.table[dice[0].result][dice[1].result],
        1: this.options.crucible.table[dice[1].result][dice[0].result],
      },
			isPrivate: isPrivate
		};

		return foundry.applications.handlebars.renderTemplate(template, chatData);
	}
}
