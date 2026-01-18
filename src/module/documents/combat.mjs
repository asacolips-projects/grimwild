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
		if (game.settings.get("grimwild", "tokenActions")) {
			this.resetActions();
		}
	}

	resetActions() {
		for (let combatant of this.combatants) {
			combatant.setFlag("grimwild", "actionCount", 0);
			combatant.actor.update({"system.tokenActions.value": 2});
		}
	}

	async spotlightCombatant(combatantId) {
		const turn = this.turns.findIndex((c) => c.id === combatantId);
		if (turn > -1) {
			const updateData = { round: this.round, turn };
			const updateOptions = {};
			Hooks.callAll("combatTurn", this, updateData, updateOptions);
			await this.update(updateData, updateOptions);
		}
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
			toggleSpark: GrimwildCombatTracker.#onToggleSpark,
			spotlight: GrimwildCombatTracker.#onSpotlight
		}
	};

	/** @override */
	static PARTS = {
		header: {
			template: "systems/grimwild/templates/combat/header.hbs"
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
		const turns = context.turns = {
			character: [],
			monster: [],
			other: []
		};
		for (const [i, combatant] of combat.turns.entries()) {
			if (!combatant.visible) continue;
			const turn = await this._prepareTurnContext(combat, combatant, i);
			if (turns?.[turn.type]) {
				turns[turn.type].push(turn);
			}
			else {
				turns.other.push(turn);
			}
		}

		context.tokenActions = game.settings.get("grimwild", "tokenActions");
		context.enableHarmPools = game.settings.get("grimwild", "enableHarmPools");

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
			turn.actionCount = game.settings.get("grimwild", "tokenActions")
				? combatant.actor.system.tokenActions.value ?? 0
				: combatant.flags?.grimwild?.actionCount ?? 0;
		}

		return turn;
	}

	_getCombatContextOptions() {
		return [{
			name: "GRIMWILD.Combat.ResetActionCount",
			icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
			condition: () => game.user.isGM && (this.viewed?.turns.length > 0),
			callback: () => this.viewed.resetActions()
		}, {
			name: "COMBAT.Settings",
			icon: '<i class="fa-solid fa-gear"></i>',
			condition: () => game.user.isGM,
			callback: () => new foundry.applications.apps.CombatTrackerConfig().render({ force: true })
		}, {
			name: "COMBAT.Delete",
			icon: '<i class="fa-solid fa-trash"></i>',
			condition: () => game.user.isGM && !!this.viewed,
			callback: () => this.viewed.endCombat()
		}];
	}

	_getEntryContextOptions() {
		const getCombatant = (li) => this.viewed.combatants.get(li.dataset.combatantId);
		return [{
			name: "COMBAT.CombatantUpdate",
			icon: '<i class="fa-solid fa-pen-to-square"></i>',
			condition: () => game.user.isGM,
			callback: (li) => getCombatant(li)?.sheet.render({
				force: true,
				position: {
					top: Math.min(li.offsetTop, window.innerHeight - 350),
					left: window.innerWidth - 720
				}
			})
		}, {
			name: "GRIMWILD.Combat.ResetActionCount",
			icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
			condition: (li) => game.user.isGM,
			callback: (li) => {
				const combatant = getCombatant(li);
				if (combatant) {
					combatant?.setFlag("grimwild", "actionCount", 0)
					combatant?.actor.update({"system.tokenActions.value": 2});
				}
			}
		}, {
			name: "COMBAT.CombatantRemove",
			icon: '<i class="fa-solid fa-trash"></i>',
			condition: () => game.user.isGM,
			callback: (li) => getCombatant(li)?.delete()
		}];
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
		const update = {};
		if (!combatant || !harm) return;
		const actor = combatant.actor;
		if (!actor.isOwner) return;
		let harmValue = actor.system?.[harm].marked;
		update[`system.${harm}.marked`] = !harmValue;
		if (game.settings.get("grimwild", "enableHarmPools")) {
			update[`system.${harm}.pool.diceNum`] = actor.system?.[harm].pool.diceNum > 0 ? 0 : 1;
		}
		actor.update(update);
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

	static #onSpotlight(...args) {
		return this._onSpotlight(...args);
	}

	async _onSpotlight(event, target) {
		event.preventDefault();

		const { combatantId } = event.target.closest(".combatant[data-combatant-id]")?.dataset ?? {};
		this.viewed.spotlightCombatant(combatantId);
	}
}
