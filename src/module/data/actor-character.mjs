import GrimwildActorBase from "./base-actor.mjs";

export default class GrimwildCharacter extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = ["GRIMWILD.Actor.Character"];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const schema = super.defineSchema();

		schema.class = new fields.StringField({required: true, blank: true});

		schema.xp = new fields.NumberField({
			integer: true,
			initial: 0,
			min: 0,
		});

		schema.healing = new fields.SchemaField({
			value: new fields.NumberField({
				...requiredInteger,
				initial: 10,
				min: 0,
			}),
		});

		schema.attributes = new fields.SchemaField({
			level: new fields.SchemaField({
				value: new fields.NumberField({ ...requiredInteger, initial: 1 })
			})
		});

		// Iterate over stat names and create a new SchemaField for each.
		schema.stats = new fields.SchemaField(
			Object.keys(CONFIG.GRIMWILD.stats).reduce((obj, stat) => {
				obj[stat] = new fields.SchemaField({
					value: new fields.NumberField({
						...requiredInteger,
						max: 4,
						initial: 1,
						min: 0
					})
				});
				return obj;
			}, {})
		);

		return schema;
	}

	prepareDerivedData() {
		// Loop through stat scores, and add their modifiers to our sheet output.
		for (const key in this.stats) {
			// Handle stat label localization.
			this.stats[key].label =
				game.i18n.localize(CONFIG.GRIMWILD.stats[key]) ?? key;
			this.stats[key].abbr =
				game.i18n.localize(CONFIG.GRIMWILD.statAbbreviations[key]) ?? key;
		}
	}

	getRollData() {
		const data = {};

		// Copy the stat scores to the top level, so that rolls can use
		// formulas like `@str.mod + 4`.
		if (this.stats) {
			for (let [k, v] of Object.entries(this.stats)) {
				data[k] = v.value;
			}
		}

		data.lvl = this.attributes.level.value;

		return data;
	}

	async roll(options) {
		const rollData = this.getRollData();

		if (options?.stat && rollData?.[options.stat]) {
			const formula = `(@${options.stat})d6kh`;
			const roll = new grimwild.roll(formula, rollData);

			console.log('roll', roll);

			await roll.toMessage({
				actor: this,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				rollMode: game.settings.get("core", "rollMode"),
			});
		}
	}
}
