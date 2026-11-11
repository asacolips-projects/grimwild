/* -------------------------------------------- */
/*  Shared Vue sheet action helpers             */
/* -------------------------------------------- */

/**
 * Handle creating a new entry in an array field of the sheet's document.
 *
 * The field is referenced by system path: either a bare top-level system field
 * name ("tables") or a nested path starting with "system."
 * ("system.tables.0.table"). Nested paths must declare their entry field type
 * via a `data-field-type` attribute, as the schema lookup only resolves
 * top-level fields.
 *
 * @todo The dual field-path convention exists so the helpers support both bare
 * top-level arrays (conditions, bonds, traits, moves, failure, tables) and
 * dynamic nested ArrayField paths. Nested paths must point at a genuine array
 * field: a SchemaField object (fixed keys) has no push/splice and cannot grow.
 * That distinction is not academic - the only historical nested caller
 * (MonsterTables' "d6 table group" buttons) targeted the fixed 6x6
 * CrucibleTableField grid, silently never persisted in the old code and
 * threw in the new one; those buttons were removed. Prepending "system." to
 * an already-prefixed path would produce a malformed key (system.system...)
 * that schema validation silently drops. A future improvement could normalize
 * callers to a single convention (always fully-qualified paths, or a separate
 * action for nested arrays) and/or resolve nested schema fields so the
 * explicit data-field-type attribute is no longer needed.
 *
 * @param {Application} sheet   The sheet invoking the action.
 * @param {PointerEvent} event  The originating click event.
 * @param {HTMLElement} target  The capturing HTML element which defined a [data-action].
 */
export async function createArrayEntry(sheet, event, target) {
	event.preventDefault();
	const { field, fieldType, count } = target.dataset;

	// Retrieve the current field value.
	const entries = !field.startsWith("system.")
		? sheet.document.system[field]
		: foundry.utils.getProperty(sheet.document, field);
	// Retrieve the schema for top-level fields.
	const schema = sheet.document.system.schema.fields?.[field];
	const fieldConstructor = fieldType ?? schema?.element.constructor.name;
	if (!fieldConstructor) return;
	// Determine the default value of the new entry.
	let defaultValue = {};
	switch (fieldConstructor) {
		case "StringField":
			defaultValue = "";
			break;

		case "ArrayField":
			defaultValue = [];
			break;

		default:
			break;
	}

	// If we're adding multiple entries at once (e.g. 6 strings), handle that now.
	const entry = count ? Array.from({ length: Number(count) }, () => defaultValue) : defaultValue;
	entries.push(entry);

	// Perform the update.
	await sheet.document.update({
		[field.startsWith("system.") ? field : `system.${field}`]: entries
	});
}

/**
 * Handle deleting an existing entry from an array field of the sheet's
 * document. See createArrayEntry for the accepted field path formats.
 *
 * @param {Application} sheet   The sheet invoking the action.
 * @param {PointerEvent} event  The originating click event.
 * @param {HTMLElement} target  The capturing HTML element which defined a [data-action].
 */
export async function deleteArrayEntry(sheet, event, target) {
	event.preventDefault();
	const { field, key } = target.dataset;

	// Retrieve the current field value.
	const entries = !field.startsWith("system.")
		? sheet.document.system[field]
		: foundry.utils.getProperty(sheet.document, field);
	entries.splice(Number(key), 1);

	// Perform the update.
	await sheet.document.update({
		[field.startsWith("system.") ? field : `system.${field}`]: entries
	});
}

/**
 * Roll a Grimwild die pool, send the result to chat, and wait for any
 * Dice So Nice animation to finish.
 *
 * @param {object} params          Roll parameters.
 * @param {number} params.diceNum  Number of dice in the pool.
 * @param {object} [params.rollData]  Roll data passed to the roll formula.
 * @param {object} params.speaker  ChatMessage speaker data.
 * @param {string} params.label    Chat flavor label.
 * @returns {Promise<number>} The number of dropped dice (results below 4).
 */
export async function rollPoolDice({ diceNum, rollData = {}, speaker, label }) {
	const roll = new grimwild.diePools(`{${diceNum}d6}`, rollData);
	const result = await roll.evaluate();
	const dice = result.dice[0].results;
	const dropped = dice.filter((die) => die.result < 4);

	// Send to chat.
	const msg = await roll.toMessage({
		speaker,
		flavor: label
	});
	// Wait for Dice So Nice if enabled.
	if (game.dice3d && msg?.id) {
		await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
	}

	return dropped.length;
}

/**
 * Update an item tracker value from a sheet action. The item is resolved from
 * the sheet's document: on actor sheets it lives in the embedded items
 * collection; on item sheets the document is the item itself.
 *
 * @param {ApplicationV2} sheet     The sheet instance (this from the action).
 * @param {PointerEvent} event      The originating event.
 * @param {HTMLElement} target      The element which defined the action.
 */
export async function updateItemTracker(sheet, event, target) {
	event.preventDefault();
	// Retrieve props.
	const {
		itemId,
		trackerKey,
		value,
		trackerValue
	} = target.dataset;

	// Only push an update if we need one. Assume we don't.
	let changes = false;

	// Retrieve the item and tracker.
	const item = sheet.document.items?.get(itemId) ?? (sheet.document.id === itemId ? sheet.document : null);
	if (!item) return;
	const trackers = item.system.trackers;
	const tracker = trackers?.[trackerKey];
	if (!tracker) return;

	// Handle point tracker updates.
	if (tracker.type === "points") {
		if (!trackerValue || !value) {
			tracker.points.value = Number(target.value);
		}
		else {
			tracker.points.value = (value === trackerValue)
				? Number(value) - 1
				: Number(value);
		}
		if (tracker.points.value < 0) tracker.points.value = 0;
		changes = true;
	}
	// Handle pool tracker updates.
	else if (tracker.type === "pool") {
		tracker.pool.diceNum = Number(target.value);
		changes = true;
	}

	// Push the update if one is needed.
	if (changes) {
		trackers[trackerKey] = tracker;
		await item.update({ "system.trackers": trackers });
	}
}

/**
 * Roll an item tracker pool (shared by actor and item sheets). Power pools
 * open the roll dialog using the owning actor's roll data when the item is
 * embedded in one; otherwise the pool rolls as plain d6s. The pool is
 * reduced by the dice that dropped.
 *
 * @param {ApplicationV2} sheet     The sheet instance (this from the action).
 * @param {string} itemId           The id of the item owning the tracker.
 * @param {string} trackerKey       The index of the tracker on the item.
 */
export async function rollItemTrackerPool(sheet, itemId, trackerKey) {
	const item = sheet.document.items?.get(itemId) ?? (sheet.document.id === itemId ? sheet.document : null);
	if (!item) return;
	const trackers = item.system.trackers;
	const tracker = trackers?.[trackerKey];
	if (!tracker) return;
	const pool = tracker.pool;
	if (!pool.diceNum) return;

	const actor = sheet.actor ?? null;
	let droppedCount = 0;

	if (pool.powerPool && actor) {
		// Power pools open the roll dialog, using the owner actor's roll data.
		const rollData = actor.getRollData();
		const rollDialog = await grimwild.applications.GrimwildRollDialog.open({
			rollData: {
				name: actor.name,
				spark: rollData?.spark,
				stat: null,
				diceLabel: `[${item.name}] ${tracker.label}`,
				diceDefault: pool.diceNum,
				isBloodied: rollData?.isBloodied,
				isRattled: rollData?.isRattled,
				isDesperate: rollData?.isDesperate,
				isMarked: false,
				actor
			}
		});
		if (rollDialog === null) {
			return;
		}

		rollData.thorns = rollDialog.thorns;
		rollData.statDice = rollDialog.dice;
		const options = { assists: rollDialog.assisters, pool };
		const formula = `{${rollData.statDice}d6kh, ${rollData.thorns}d8}`;
		const roll = new grimwild.roll(formula, rollData, options);
		const result = await roll.evaluate();
		// Limit to just the pool dice when checking for dropped dice.
		const dice = result.dice[0].results.slice(0, pool.diceNum);
		droppedCount = dice.filter((die) => die.result < 4).length;

		// Spend spark on the owning actor, if any was used.
		const update = {};
		if (rollDialog.sparkUsed > 0) {
			const sparkUsed = rollDialog.sparkUsed;
			const newSpark = { steps: actor.system.spark.steps };
			// All of your spark is used.
			if (sparkUsed > 1 || actor.system.spark.value === 1) {
				newSpark.steps[0] = false;
				newSpark.steps[1] = false;
			}
			// If half of your spark is used.
			else if (sparkUsed === 1 && actor.system.spark.value > 1) {
				newSpark.steps[0] = true;
				newSpark.steps[1] = false;
			}
			update["system.spark"] = newSpark;
		}

		// Send to chat.
		const msg = await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor }),
			flavor: `[${item.name}] ${tracker.label}`
		});
		// Wait for Dice So Nice if enabled.
		if (game.dice3d && msg?.id) {
			await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
		}

		// Update the action count.
		for (const combat of game.combats) {
			const combatant = combat?.getCombatantsByActor(actor.id)?.[0] || null;
			if (combatant) {
				const actionCount = Number(combatant.flags?.grimwild?.actionCount ?? 0);
				await combatant.setFlag("grimwild", "actionCount", actionCount + 1);
				update["system.tokenActions.value"] = Math.max(actor.system.tokenActions.value - 1, 0);

				// Update the active turn.
				const combatantTurn = combat.turns.findIndex((c) => c.id === combatant.id);
				if (combatantTurn !== undefined) {
					combat.update({ turn: combatantTurn });
				}
			}
		}

		// Push actor updates (spark, token actions).
		if (Object.keys(update).length > 0) {
			await actor.update(update);
		}
	}
	else {
		// Plain pools roll as d6s and shed their failures.
		droppedCount = await rollPoolDice({
			diceNum: pool.diceNum,
			rollData: item.getRollData(),
			speaker: ChatMessage.getSpeaker({ actor }),
			label: `[${item.type}] ${item.name}`
		});
	}

	// Shed the dropped dice from the pool.
	pool.diceNum -= droppedCount;
	await item.update({ "system.trackers": item.system.trackers });
}
