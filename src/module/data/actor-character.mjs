import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField } from "../helpers/schema.mjs";
import { isPhysicalStat } from "../helpers/config.mjs";
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

		// The harm track. Stat marks upgrade into Bloodied (physical) or
		// Rattled (mental) harm, which can escalate further into Desperate
		// (CE rules only) and then Dropped. See applyMark and applyHarm below.
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
		// Desperate is only used with the Community Edition rules enabled, and
		// intentionally does not take part in harm pools.
		schema.desperate = new fields.SchemaField({
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

		schema.tokenActions = new fields.SchemaField({
			value: new fields.NumberField({
				...requiredInteger,
				max: 2,
				initial: 2,
				min: 0
			}),
			max: new fields.NumberField({
				...requiredInteger,
				initial: 2,
				min: 0
			})
		});

		return schema;
	}

	get level() {
		if (this.xp.value < 2) return 1;

		// 2x XP for slow XP progression.
		let xpMultiplier = game.settings.get("grimwild", "slowXp") ? 2 : 1;

		// Initial state.
		let nextLevel = 2;
		let nextLevelXp = nextLevel * xpMultiplier;

		// Iterate and compare against XP requirements. On each successful iteration,
		// bump the level by 1 and add the new XP threshold to the running tally.
		while (this.xp.value >= nextLevelXp) {
			nextLevel++;
			nextLevelXp += (nextLevel * xpMultiplier);
		}

		// We're evaluating the next level, so return nextLevel - 1 to get actual level.
		return nextLevel - 1;
	}

	get isBloodied() {
		return this.bloodied.marked;
	}

	get isRattled() {
		return this.rattled.marked;
	}

	get isDesperate() {
		return this.desperate.marked;
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
					case "wit":
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

	/**
	 * Apply a stat Mark, the first step of the damage track.
	 *
	 * The damage track escalates in a fixed order: stat Marks upgrade into
	 * Harm, Harm escalates into Desperate (Community Edition rules only), and
	 * Desperate escalates into Dropped. An unmarked stat gains a Mark, while a
	 * Mark on an already marked stat upgrades into Harm instead: physical
	 * stats (Brawn, Agility) become Bloodied, mental stats (Wits, Presence)
	 * become Rattled.
	 *
	 * @param {string} stat  The stat to mark: bra, agi, wit, or pre.
	 * @returns {Promise<GrimwildActor>|void} The updated actor, or void for invalid stats.
	 */
	async applyMark(stat) {
		if (!Object.keys(CONFIG.GRIMWILD.stats).includes(stat)) return;

		// An already marked stat upgrades its Mark into Harm.
		if (this.stats[stat].marked) {
			return this.applyHarm(isPhysicalStat(stat) ? "bloodied" : "rattled");
		}
		return this.parent.update({ [`system.stats.${stat}.marked`]: true });
	}

	/**
	 * Apply Bloodied or Rattled harm, the second step of the damage track.
	 *
	 * Unmarked harm is simply marked. With the harm pools homebrew enabled
	 * (enableHarmPools), each harm also feeds that harm's pool: fresh harm
	 * seeds the pool with a die, and further harm adds dice up to the max
	 * configured in the system settings. Pool dice can be rolled from the
	 * sheet to shed dice as recovery, and a pool that empties out clears its
	 * harm mark (see _preUpdate, which keeps marks and pools in sync).
	 *
	 * If the harm is already marked and the pool is full (or the homebrew is
	 * disabled), the harm escalates instead: with the Community Edition rules
	 * the character becomes Desperate unless already Desperate, in which case
	 * they become Dropped. Without the CE rules, harm escalates straight to
	 * Dropped.
	 *
	 * @param {string} harm  The harm to apply: bloodied or rattled.
	 * @returns {Promise<GrimwildActor>|void} The updated actor, or void for invalid harm.
	 */
	async applyHarm(harm) {
		if (!["bloodied", "rattled"].includes(harm)) return;

		const harmPools = game.settings.get("grimwild", "enableHarmPools");
		const maxHarm = game.settings.get("grimwild", `max${harm === "bloodied" ? "Bloodied" : "Rattled"}`) ?? 1;
		const ceRulesEnabled = game.settings.get("grimwild", "ceRules");
		const update = {};

		if (!this[harm].marked) {
			// Fresh harm: mark it, seeding the pool if the homebrew is enabled.
			update[`system.${harm}.marked`] = true;
			if (harmPools) {
				update[`system.${harm}.pool.diceNum`] = Math.min(this[harm].pool.diceNum + 1, maxHarm);
			}
		}
		else if (!harmPools || this[harm].pool.diceNum >= maxHarm) {
			// Overflow harm with nowhere to add a die: escalate along the track.
			if (ceRulesEnabled) {
				// CE inserts Desperate between Harm and Dropped, so the
				// character only becomes Dropped once overflow harm lands
				// while they are already Desperate. Setting dropped to the
				// current desperate state handles both cases in one update.
				update["system.dropped"] = this.desperate.marked;
				update["system.desperate.marked"] = true;
			}
			else {
				update["system.dropped"] = true;
			}
		}
		else {
			// Marked with pool room to spare: pile on as an additional pool die.
			update[`system.${harm}.pool.diceNum`] = this[harm].pool.diceNum + 1;
		}

		return this.parent.update(update);
	}

	async _preUpdate(changes, options, user) {
		if (game.settings.get("grimwild", "enableHarmPools")) {
			// Harm marks and their pools are kept in sync in both directions:
			// marking harm on the sheet seeds its pool, and a pool that empties
			// out (e.g. from recovery rolls) unmarks and heals the harm.
			const checkPool = (change, source) => {
				if (change) {
					// Marking harm seeds its healing pool with a die.
					if (change.marked && !source.marked && !change.pool.diceNum && !source.pool.diceNum) {
						change.pool.diceNum = 1;
					}
					// Unmarking harm clears its healing pool.
					if (!change.marked && source.marked && change.pool.diceNum === source.pool.diceNum) {
						change.pool.diceNum = 0;
					}
					// A pool gaining its first die marks the harm.
					if (!source.marked && change.pool.diceNum && !source.pool.diceNum) {
						change.marked = true;
					}
					// A pool that empties out unmarks the harm, healing it.
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
		data.isDesperate = this.isDesperate;
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
					diceLabel: game.i18n.localize(`GRIMWILD.Stat.${options.stat}.long`),
					diceDefault: rollData?.stats?.[options.stat].value,
					isBloodied: rollData?.isBloodied,
					isRattled: rollData?.isRattled,
					isDesperate: rollData?.isDesperate,
					isMarked: rollData?.stats?.[options.stat].marked,
					actor: this.parent
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
				speaker: ChatMessage.getSpeaker({ actor: this })
			});

			await this.updateCombatActionCount();
		}
	}

	/**
	 * Update action count for combatants.
	 */
	async updateCombatActionCount() {
		for (const combat of game.combats) {
			const combatant = combat?.getCombatantsByActor(this.parent.id)?.[0] || null;
			if (combatant) {
				const actionCount = Number(combatant.flags?.grimwild?.actionCount ?? 0);
				await combatant.setFlag("grimwild", "actionCount", actionCount + 1);

				const actor = combatant.actor;
				await actor.update({ "system.tokenActions.value": Math.max(actor.system.tokenActions.value - 1, 0) });

				// Update the active turn.
				const combatantTurn = combat.turns.findIndex((c) => c.id === combatant.id);
				if (combatantTurn !== undefined) {
					combat.update({ turn: combatantTurn });
				}
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
