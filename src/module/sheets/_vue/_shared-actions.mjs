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
