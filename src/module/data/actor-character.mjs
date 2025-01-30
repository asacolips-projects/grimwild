import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField } from "../helpers/schema.mjs";
import { isMentalStat, isPhysicalStat } from "../helpers/config.mjs";

export default class GrimwildCharacter extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = ["GRIMWILD.Actor.Character"];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const schema = super.defineSchema();

		schema.path = new fields.StringField({ required: true, blank: true });

		schema.xp = new fields.NumberField({
			integer: true,
			initial: 0,
			min: 0
		});

		schema.attributes = new fields.SchemaField({
			level: new fields.SchemaField({
				value: new fields.NumberField({ ...requiredInteger, initial: 1 })
			})
		});

		// should these have some sort of healing pool attached to them?
		schema.bloodied = new DicePoolField();
		schema.rattled = new DicePoolField();
		schema.conditions = new fields.ArrayField(new fields.SchemaField({
			name: new fields.StringField(),
			pool: new DicePoolField(),
			severity: new fields.StringField({
				choices: {
					urgent: "Urgent",
					shortTerm: "Short Term",
					longTerm: "Long Term",
					permanent: "Permanent"
				}
			})
		}));

		schema.spark = new fields.SchemaField({
			steps: new fields.ArrayField(new fields.BooleanField),
		});

		schema.story = new fields.SchemaField({
			steps: new fields.ArrayField(new fields.BooleanField),
		});

		// Iterate over stat names and create a new SchemaField for each.
		schema.stats = new fields.SchemaField(
			Object.keys(CONFIG.GRIMWILD.stats).reduce((obj, stat) => {
				obj[stat] = new fields.SchemaField({
					value: new fields.NumberField({
						...requiredInteger,
						max: 3,
						initial: 1,
						min: 0
					}),
					marked: new fields.BooleanField()
				});
				return obj;
			}, {})
		);

		schema.features = new fields.StringField();
		schema.backgrounds = new fields.ArrayField(
			new fields.SchemaField({
				name: new fields.StringField(),
				wises: new fields.ArrayField(new fields.StringField())
			})
		);
		schema.traits = new fields.ArrayField(new fields.SchemaField({
			are: new fields.BooleanField(),
			value: new fields.StringField()
		}));
		schema.desires = new fields.ArrayField(new fields.SchemaField({
			are: new fields.BooleanField(),
			value: new fields.StringField()
		}));
		schema.bonds = new fields.ArrayField(
			new fields.SchemaField({
				name: new fields.StringField(),
				description: new fields.StringField()
			})
		);

		return schema;
	}

	get level() {
		if (this.xp < 2) return 1;

		let step = 2;
		let threshold = 2;

		while (this.xp >= threshold) {
			step++;
			threshold += step; // Increment threshold by the next step value
		}

		return step - 1;
	}

	get isBloodied() {
		return this.bloodied.diceNum > 0;
	}

	get isRattled() {
		return this.rattled.diceNum > 0;
	}

	get orderedStats() {
		const orderedStats = [];
		for (let [k, v] of Object.entries(this.stats)) {
			orderedStats.push({ key: k, value: v });
		}
		orderedStats.sort((a, b) => {
			const order = (s) => {
				switch (s) {
					case "bra":
						return 0;
					case "agi":
						return 1;
					case "wis":
						return 2;
					case "pre":
						return 3;
					default:
						return 100;
				}
			};
			return order(a.key) - order(b.key);
		});
		return orderedStats;
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

		// Calculate spark and story values.
		this.spark.value = 0;
		for (const step in this.spark.steps) {
			if (this.spark.steps[step]) this.spark.value++;
		}
		this.story.value = 0;
		for (const step in this.story.steps) {
			if (this.story.steps[step]) this.story.value++;
		}
	}

	getRollData() {
		const data = this.toObject();

		// Copy the stat scores to the top level, so that rolls can use
		// formulas like `@str.mod + 4`.
		if (this.stats) {
			for (let [k, v] of Object.entries(this.stats)) {
				data.stats[k] = v.value;
			}
		}
		data.orderedStats = this.orderedStats;

		// Handle getters.
		data.isBloodied = this.isBloodied;
		data.isRattled = this.isRattled;

		return data;
	}

	async roll(options) {
		const rollData = this.getRollData();

		if (options?.stat && rollData?.stats?.[options.stat]) {
			const content = await renderTemplate("systems/grimwild/templates/dialog/stat-roll.hbs", {
				diceDefault: rollData?.stats?.[options.stat],
				isBloodied: rollData?.isBloodied,
				isRattled: rollData?.isRattled,
				stats: rollData.orderedStats
			});
			const rollDialog = await foundry.applications.api.DialogV2.wait({
				window: { title: "Grimwild Roll" },
				content,
				modal: true,
				buttons: [
					{
						label: game.i18n.localize("GRIMWILD.Dialog.Roll"),
						action: "roll",
						callback: (event, button, dialog) => {
							return { dice: button.form.elements.dice.value, thorns: button.form.elements.totalThorns.value };
						}
					}
				],
				render: (event, html) => {
					const checkboxes = html.querySelectorAll('input[type="checkbox"]');
					const difficultyInput = html.querySelector("#difficulty");
					const totalDisplay = html.querySelector("#total");
					const totalValue = html.querySelector("#totalThorns");

					const updateTotal = () => {
						let total = Array.from(checkboxes).reduce((sum, checkbox) => sum + (checkbox.checked ? 1 : 0), 0);
						total += parseInt(difficultyInput.value || 0, 10);
						totalDisplay.textContent = total;
						totalValue.value = total;
					};

					// Attach event listeners for dynamic updates
					checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateTotal));
					difficultyInput.addEventListener("input", updateTotal);

					// Initialize the total
					updateTotal();
				}
			});
			rollData.thorns = rollDialog.thorns;
			rollData.statDice = rollDialog.dice;
			const formula = "{(@statDice)d6kh, (@thorns)d8}";
			const roll = new grimwild.roll(formula, rollData);

			await roll.toMessage({
				actor: this,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				rollMode: game.settings.get("core", "rollMode")
			});
		}
	}
}
