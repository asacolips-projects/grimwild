export class GrimwildCombat extends foundry.documents.Combat {
	/** @inheritdoc */
	async _onCreate(data, options, userId) {
	}

	/** @inheritdoc */
	async _onEnter(combatant) {
		let currentInit = 200;
		const characters = this.combatants.filter((c) => c.actor.type === "character").sort((a, b) => a.initiative - b.initiative);
		const monsters = this.combatants.filter((c) => c.actor.type === "monster").sort((a, b) => a.initiative - b.initiative);

		// Iterate over characters.
		for (let c of characters) {
			if (c.id !== combatant.id) {
				await c.update({ initiative: currentInit });
				currentInit -= 10;
			}
		}

		// Add current character.
		if (combatant.actor.type === "character") {
			await combatant.update({ initiative: currentInit });
			currentInit -= 10;
		}

		// Iterate over monsters.
		for (let c of monsters) {
			if (c.id !== combatant.id) {
				await c.update({ initiative: currentInit });
				currentInit -= 10;
			}
		}

		// Add current monster.
		if (combatant.actor.type === "monster") {
			await combatant.update({ initiative: currentInit });
			currentInit -= 10;
		}
	}

	/** @inheritdoc */
	async _onStartRound(context) {
	}
}

export class GrimwildCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		window: {
			title: "COMBAT.SidebarTitle"
		},
		actions: {
			toggleHarm: GrimwildCombatTracker.#onToggleHarm,
			toggleSpark: GrimwildCombatTracker.#onToggleSpark
		}
	};

	/** @override */
	static PARTS = {
		header: {
			template: "templates/sidebar/tabs/combat/header.hbs"
		},
		tracker: {
			template: "systems/grimwild/templates/combat/tracker.hbs"
		},
		footer: {
			template: "templates/sidebar/tabs/combat/footer.hbs"
		}
	};

	/**
	 * Prepare render context for the tracker part.
	 * @param {ApplicationRenderContext} context
	 * @param {HandlebarsRenderOptions} options
	 * @returns {Promise<void>}
	 * @protected
	 */
	async _prepareTrackerContext(context, options) {
		const combat = this.viewed;
		if (!combat) return;
		let hasDecimals = false;
		const turns = context.turns = {
			character: [],
			monster: [],
			other: []
		};
		for (const [i, combatant] of combat.turns.entries()) {
			if (!combatant.visible) continue;
			const turn = await this._prepareTurnContext(combat, combatant, i);
			// console.log('TURN', turn);
			if (turn.hasDecimals) hasDecimals = true;
			if (turns?.[turn.type]) {
				turns[turn.type].push(turn);
			}
			else {
				turns.other.push(turn);
			}
		}

		if (!turns.character.length) delete turns.character;
		if (!turns.monster.length) delete turns.monster;
		if (!turns.other.length) delete turns.other;
	}

	/**
	 * Prepare render context for a single entry in the combat tracker.
	 * @param {Combat} combat        The active combat.
	 * @param {Combatant} combatant  The Combatant whose turn is being prepared.
	 * @param {number} index         The index of this entry in the turn order.
	 * @returns {Promise<object>}
	 * @protected
	 */
	async _prepareTurnContext(combat, combatant, index) {
		const turn = await super._prepareTurnContext(combat, combatant, index);
		turn.type = combatant.actor.type;
		if (turn.type === "character") {
			turn.spark = combatant.actor.system.spark;
			turn.bloodied = combatant.actor.system.bloodied;
			turn.rattled = combatant.actor.system.rattled;
			turn.actionCount = combatant.flags?.grimwild?.actionCount ?? 0;
		}

		return turn;
	}

	/** @inheritdoc */
	async render(options = {}, _options = {}) {
		const renderResult = await super.render(options);
		return renderResult;
	}

	/* --------------------------------------------------------------------------------------------*/
	/* ACTIONS */
	/* --------------------------------------------------------------------------------------------*/
	static #onToggleHarm(...args) {
		return this._onToggleHarm(...args);
	}

	async _onToggleHarm(event, target) {
		event.preventDefault();
		const { combatantId } = event.target.closest(".combatant[data-combatant-id]")?.dataset ?? {};
		const { harm } = target.dataset ?? false;
		const combatant = this.viewed.combatants.get(combatantId);
		if (!combatant || !harm) return;
		const actor = combatant.actor;
		if (!actor.isOwner) return;
		const harmValue = actor.system?.[harm].marked;
		actor.update({ [`system.${harm}.marked`]: !harmValue });
	}

	static #onToggleSpark(...args) {
		return this._onToggleSpark(...args);
	}

	async _onToggleSpark(event, target) {
		event.preventDefault();
		const { combatantId } = event.target.closest(".combatant[data-combatant-id]")?.dataset ?? {};
		const combatant = this.viewed.combatants.get(combatantId);
		if (!combatant) return;
		const actor = combatant.actor;
		if (!actor.isOwner) return;

		let spark = actor.system.spark.value;
		spark = spark < 2 ? spark + 1 : 0;

		let steps = [false, false];
		if (spark === 1) steps = [true, false];
		if (spark === 2) steps = [true, true];

		actor.update({ "system.spark.steps": steps });
	}
}
