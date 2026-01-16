// @TODO make this actually work.
export default class GrimwildCrucibleRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-crucible.hbs";

	constructor(formula, data, options) {
		super(formula, data, options);
    console.log('crucible', this);
		if (game.dice3d && game.settings.get("grimwild", "diceSoNiceOverride")) {
			if (!this.options.appearance) this.options.appearance = {};
			this.options.appearance.system = "grimwild";
			this.options.appearance.colorset = "grimwild-dark";
		}
	}

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
    console.log('crucible', this);
		if (!this._evaluated) await this.evaluate();

		const chatData = {
			formula: isPrivate ? "???" : this._formula,
			flavor: isPrivate ? null : flavor ?? this.options.flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			stat: this.options.stat,
			dice: this.dice[0].results,
      crucible: {
        0: this.options.crucible.table[this.dice[0].results[0]],
        1: this.options.crucible.table[this.dice[0].results[1]],
      },
			isPrivate: isPrivate
		};

		return foundry.applications.handlebars.renderTemplate(template, chatData);
	}
}
