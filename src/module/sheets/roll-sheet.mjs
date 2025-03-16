import { isMentalStat, isPhysicalStat } from "../helpers/config.mjs";

const { api, sheets } = foundry.applications;

export class GrimwildRollSheet extends api.HandlebarsApplicationMixin(
	sheets.ItemSheetV2
) {
	static DEFAULT_OPTIONS = {
		id: "foo-form",
		form: {
			handler: GrimwildRollSheet.#onSubmit,
			closeOnSubmit: false,
			submitOnChange: true
		},
		position: {
			width: 640,
			height: "auto"
		},
		tag: "form",
		window: {
			icon: "fas fa-dice-d6"
		},
		actions: {
			performRoll: GrimwildRollSheet.performRoll
		}
	};

	static PARTS = {
		main: {
			template: "systems/grimwild/templates/dialog/chat-stat-roll.hbs"
		}
	};

	get title() {
		return "Grimwild Roll";
	}

	_prepareContext(options) {
		const rollOptions = this.document.rolls[0].options;
		const hasSpark = rollOptions.spark > 0;
		const sparkArray = Array.from({ length: rollOptions.spark }, (_, i) => i);
		// Ignore mark if there is associated harm
		const markIgnored = rollOptions.isMarked
			&& ((rollOptions.isBloodied && isPhysicalStat(rollOptions.stat))
			|| (rollOptions.isRattled && isMentalStat(rollOptions.stat)));
		// Do not check marked if it is ignored
		const isMarked = rollOptions.isMarked && !markIgnored;
		const assistants = game.actors.filter((a) => a.type === "character" && a.name !== rollOptions.name).map((a) => a.name);

		return { ...rollOptions, hasSpark, sparkArray, markIgnored, isMarked, assistants };
	}

	_onRender(context, options) {}

	static performRoll() {
		this.close();
		this.document.performRoll();
	}

	static async #onSubmit(event, form, formData) {
		const data = foundry.utils.expandObject(formData.object);
		data.sparkUsed = data.sparkUsed ? Object.values(data.sparkUsed).reduce((acc, cur) => acc + cur ? 1 : 0, 0) : 0;
		const diff = foundry.utils.diffObject(this.document.rolls[0].options, data);

		this.document.rolls[0].options = Object.assign(this.document.rolls[0].options, diff);
		this.document.update({ rolls: this.document.rolls });
	}
}
