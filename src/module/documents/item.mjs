/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class GrimwildItem extends Item {
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData() {
		// As with the actor class, items are documents that can have their data
		// preparation methods overridden (such as prepareBaseData()).
		super.prepareData();
	}

	/**
	 * Prepare a data object which defines the data schema used by dice roll commands against this Item
	 * @override
	 */
	getRollData() {
		// Starts off by populating the roll data with a shallow copy of `this.system`
		const rollData = { ...this.system };

		// Quit early if there's no parent actor
		if (!this.actor) return rollData;

		// If present, add the actor's roll data
		rollData.actor = this.actor.getRollData();

		return rollData;
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @returns {Roll|void} The roll object used for the chat message, if any.
	 */
	async roll(event) {
		const item = this;

		// Initialize chat data.
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		const label = `[${item.type}] ${item.name}`;

		// If there's no roll data, send a chat message.
		if (!this.system.pool) {
			ChatMessage.create({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
				content: item.system.description ?? ""
			});
		}
		// Otherwise, create a roll and send a chat message from it.
		else {
			// Retrieve roll data.
			const rollData = this.getRollData();

			// Invoke the roll and submit it to chat.
			const roll = new grimwild.diePools(`{${rollData.pool.diceNum}d6}`, rollData.actor);
			// If you need to store the value first, uncomment the next line.
			const result = await roll.evaluate();
			const dice = result.dice[0].results;
			const dropped = dice.filter((die) => die.result < 4);
			// Send to chat.
			const msg = await roll.toMessage({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label
			});
			// Wait for Dice So Nice if enabled.
			if (game.dice3d && msg?.id) {
				await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
			}
			// Update the item.
			await item.update({ "system.pool.diceNum": dice.length - dropped.length });

			return roll;
		}
	}
}
