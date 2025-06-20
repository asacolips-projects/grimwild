import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField } from "../helpers/schema.mjs";
import { GrimwildRollDialog } from "../apps/roll-dialog.mjs";

export default class GrimwildCharacter extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Actor.base",
		"GRIMWILD.Actor.Character"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const schema = super.defineSchema();

		schema.path = new fields.StringField({ required: true, blank: true });

		schema.xp = new fields.SchemaField({
			value: new fields.NumberField({
				integer: true,
				initial: 0,
				min: 0
			})
		});

		schema.attributes = new fields.SchemaField({
			level: new fields.SchemaField({
				value: new fields.NumberField({ ...requiredInteger, initial: 1 })
			})
		});

		schema.bloodied = new fields.SchemaField({
			pool: new DicePoolField(),
			marked: new fields.BooleanField(),
			dropped: new fields.BooleanField()
		});
		schema.rattled = new fields.SchemaField({
			pool: new DicePoolField(),
			marked: new fields.BooleanField(),
			dropped: new fields.BooleanField()
		});

		schema.dropped = new fields.BooleanField();

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
			steps: new fields.ArrayField(new fields.BooleanField())
		});

		schema.story = new fields.SchemaField({
			steps: new fields.ArrayField(new fields.BooleanField())
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
			}),
			{
				initial: [
					{ name: "", wises: ["", "", ""] },
					{ name: "", wises: ["", "", ""] }
				]
			}
		);

		schema.traits = new fields.ArrayField(
			new fields.SchemaField({
				are: new fields.BooleanField(),
				value: new fields.StringField()
			}),
			{
				initial: [
					{ are: true, value: "" },
					{ are: true, value: "" },
					{ are: false, value: "" }
				]
			}
		);

		schema.desires = new fields.ArrayField(
			new fields.SchemaField({
				are: new fields.BooleanField(),
				value: new fields.StringField()
			}),
			{
				initial: [
					{ are: true, value: "" },
					{ are: true, value: "" },
					{ are: false, value: "" }
				]
			}
		);

		schema.bonds = new fields.ArrayField(
			new fields.SchemaField({
				name: new fields.StringField(),
				description: new fields.StringField()
			})
		);

		return schema;
	}

	get level() {
		if (this.xp.value < 2) return 1;

		let step = 2;
		let threshold = 2;

		while (this.xp.value >= threshold) {
			step++;
			threshold += step; // Increment threshold by the next step value
		}

		return step - 1;
	}

	get isBloodied() {
		return this.bloodied.marked;
	}

	get isRattled() {
		return this.rattled.marked;
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

	async _preUpdate(changes, options, user) {
		if (game.settings.get("grimwild", "enableHarmPools")) {
			const checkPool = (change, source) => {
				if (change) {
					// Start the healing pool
					if (change.marked && !source.marked && !change.pool.diceNum && !source.pool.diceNum) {
						change.pool.diceNum = 1;
					}
					// Cancel the healing pool
					if (!change.marked && source.marked && change.pool.diceNum === source.pool.diceNum) {
						change.pool.diceNum = 0;
					}
					// Pool started
					if (!source.marked && change.pool.diceNum && !source.pool.diceNum) {
						change.marked = true;
					}
					// Pool expired
					if (source.marked && !change.pool.diceNum && source.pool.diceNum) {
						change.marked = false;
					}
				}
			};
			checkPool(changes.system?.bloodied, this._source.bloodied);
			checkPool(changes.system?.rattled, this._source.rattled);
		}

		const checkSteps = (change, source) => {
			if (change) {
				// Mark both
				if (!source.steps[1] && change.steps[1] && !change.steps[0]) {
					change.steps[0] = true;
				}
				// Clear both
				if (source.steps[0] && change.steps[1] && !change.steps[0]) {
					change.steps[1] = false;
				}
			}
		};
		checkSteps(changes.system?.spark, this._source.spark);
		checkSteps(changes.system?.story, this._source.story);
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

		// Calculate XP pips for the sheet.
		this.xp.steps = [];
		let xpTally = 1;
		for (let i = 0; i < 6; i++) {
			this.xp.steps.push([]);
			for (let j = 0; j < i + 2; j++) {
				this.xp.steps[i].push(xpTally);
				xpTally++;
			}
		}
	}

	getRollData() {
		const data = this.toObject();

		if (this.stats) {
			for (let [k, v] of Object.entries(this.stats)) {
				data.stats[k] = v;
			}
		}

		// Handle getters.
		data.isBloodied = this.isBloodied;
		data.isRattled = this.isRattled;
		data.spark = this.spark.value;
		data.id = this.parent.id;

		return data;
	}

	async roll(options) {
		const rollData = this.getRollData();

		if (options?.stat && rollData?.stats?.[options.stat]) {
			const rollDialog = await GrimwildRollDialog.open({
				rollData: {
					name: this?.name ?? this?.parent?.name,
					spark: rollData?.spark,
					stat: options.stat,
					diceDefault: rollData?.stats?.[options.stat].value,
					isBloodied: rollData?.isBloodied,
					isRattled: rollData?.isRattled,
					isMarked: rollData?.stats?.[options.stat].marked
				}
			});
			// bail out if they closed the dialog
			if (rollDialog === null) {
				return;
			}
			rollData.thorns = rollDialog.thorns;
			rollData.statDice = rollDialog.dice;
			options.assists = rollDialog.assisters;
			const formula = "{(@statDice)d6kh, (@thorns)d8}";
			const roll = new grimwild.roll(formula, rollData, options);

			const updates = {};

			// Remove used spark.
			if (rollDialog.sparkUsed > 0) {
				let sparkUsed = rollDialog.sparkUsed;
				const newSpark = {
					steps: this.spark.steps
				};
				// All of your spark is used.
				if (sparkUsed > 1 || this.spark.value === 1) {
					newSpark.steps[0] = false;
					newSpark.steps[1] = false;
				}
				// If half of your spark is used.
				else if (sparkUsed === 1 && this.spark.value > 1) {
					newSpark.steps[0] = true;
					newSpark.steps[1] = false;
				}
				updates["system.spark"] = newSpark;
			}

			// Remove marks.
			if (rollData?.stats?.[options.stat].marked) {
				updates[`system.stats.${options.stat}.marked`] = false;
			}

			// Handle the updates.
			const actor = game.actors.get(this.parent.id);
			await actor.update(updates);
			actor.sheet.render(true);

			await roll.toMessage({
				actor: this,
				speaker: ChatMessage.getSpeaker({ actor: this }),
				rollMode: game.settings.get("core", "rollMode")
			});

			await this.updateCombatActionCount();

		}
	}

	/**
	 * Update action count for combatants.
	 */
	async updateCombatActionCount() {
		for (const combat of game.combats) {
			const combatant = combat?.getCombatantByActor(this.parent.id);
			if (combatant) {
				const actionCount = Number(combatant.flags?.grimwild?.actionCount ?? 0);
				await combatant.setFlag("grimwild", "actionCount", actionCount + 1);
			}
		}
	}

	/**
	 * Migrate a document to a newer schema.
	 *
	 * @param {object} source Source document.
	 * @returns {object} Source document with migrated data values.
	 */
	static migrateData(source) {
		if (!source.bloodied?.pool && source.bloodied?.diceNum) {
			const oldBloodied = { ...source.bloodied };
			source.bloodied = {
				pool: oldBloodied,
				marked: false
			};
		}

		if (!source.rattled?.pool && source.rattled?.diceNum) {
			const oldRattled = { ...source.rattled };
			source.rattled = {
				pool: oldRattled,
				marked: false
			};
		}

		return super.migrateData(source);
	}
}
