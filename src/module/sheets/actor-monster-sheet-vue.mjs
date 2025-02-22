import { MonsterSheetVue } from "../../vue/components.vue.es.mjs";
import { GrimwildActorSheetVue } from "./actor-sheet-vue.mjs";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorMonsterSheetVue extends GrimwildActorSheetVue {
	vueParts = {
		"monster-sheet": {
			component: MonsterSheetVue,
			template: "<monster-sheet :context=\"context\">Vue rendering for sheet failed.</monster-sheet>"
		}
	};

	enrichmentOptions = {
		documentFields: [
			"biography",
			"notes"
		],
		itemFields: {
			challenge: [
				"description"
			]
		}
	};

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor", "monster"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 600,
			height: 800
		},
		window: {
			resizable: true
		},
		tag: "form",
		actions: {
			onEditImage: this._onEditImage,
			viewDoc: this._viewDoc,
			createDoc: this._createDoc,
			deleteDoc: this._deleteDoc,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			rollPool: this._rollPool,
			roll: this._onRoll
		},
		changeActions: {
			updateChallengePool: this._updateChallengePool
		},
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		form: {
			submitOnChange: true,
			submitOnClose: true
		}
	};

	/**
	 * Actions performed after any render of the Application.
	 * Post-render steps are not awaited by the render process.
	 * @param {ApplicationRenderContext} context      Prepared context data
	 * @param {RenderOptions} options                 Provided render options
	 * @protected
	 */
	_onRender(context, options) {
		super._onRender(context, options);
		// @todo figure out how to attach this to the application frame rather than
		// using render key to prevent redundant events.
	}

	async _prepareContext(options) {
		// Output initialization
		const context = {
			// Validates both permissions and compendium status
			editable: this.isEditable,
			owner: this.document.isOwner,
			limited: this.document.limited,
			// Add the actor document.
			actor: this.actor.toObject(),
			// Add the actor's data to context.data for easier access, as well as flags.
			system: this.actor.system,
			flags: this.actor.flags,
			// Roll data.
			rollData: this.actor.getRollData() ?? {},
			// Adding a pointer to CONFIG.GRIMWILD
			config: CONFIG.GRIMWILD,
			// Force re-renders. Defined in the vue mixin.
			_renderKey: this._renderKey ?? 0,
			_arrayEntryKey: this._arrayEntryKey ?? 0,
			// tabs: this._getTabs(options.parts),
			// Necessary for formInput and formFields helpers
			fields: this.document.schema.fields,
			systemFields: this.document.system.schema.fields
		};

		// Handle embedded documents.
		this._prepareItems(context);

		// Handle tabs.
		this._prepareTabs(context);

		// Handle enriched fields.
		const enrichmentOptions = {
			// Whether to show secret blocks in the finished html
			secrets: this.document.isOwner,
			// Data to fill in for inline rolls
			rollData: this.actor.getRollData() ?? {},
			// Relative UUID resolution
			relativeTo: this.actor
		};

		const editorOptions = {
			toggled: true,
			collaborate: true,
			documentUUID: this.document.uuid,
			height: 300
		};

		// Handle enriching fields.
		context.editors = {};
		await this._enrichFields(context, enrichmentOptions, editorOptions);

		// Make another pass through the editors to fix the element contents.
		for (let [field, editor] of Object.entries(context.editors)) {
			if (context.editors[field].element) {
				context.editors[field].element.innerHTML = context.editors[field].enriched;
			}
		}

		// Handle other custom elements.
		context.customElements = {};
		for (let [colorKey, color] of this.document.system.sensories.colors.entries()) {
			context.customElements[`system.sensories.colors.${colorKey}.color`] = foundry.applications.elements.HTMLColorPickerElement.create({
				name: `system.sensories.colors.${colorKey}.color`,
				value: color.color
			});
		}

		console.log("monster", context);

		return context;
	}

	/**
	 * Prepare tabs for Vue.
	 *
	 * @param {object} context
	 */
	_prepareTabs(context) {
		// Initialize tabs.
		context.tabs = {
			primary: {}
		};

		// Tabs available to all actors.
		context.tabs.primary.biography = {
			key: "biography",
			label: game.i18n.localize("GRIMWILD.Actor.Tabs.Biography"),
			active: false
		};

		context.tabs.primary.moves = {
			key: "moves",
			label: "Traits / Moves",
			active: false
		};

		context.tabs.primary.tables = {
			key: "tables",
			label: "Tables",
			active: false
		};

		context.tabs.primary.challenges = {
			key: "challenges",
			label: game.i18n.localize("GRIMWILD.Actor.Tabs.Challenges"),
			active: true
		};

		context.tabs.primary.notes = {
			key: "notes",
			label: game.i18n.localize("GRIMWILD.Actor.Tabs.Notes"),
			active: false
		};
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle rolling pools on the character sheet.
	 * @todo abstract this to the actor itself.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _rollPool(event, target) {
		event.preventDefault();
		// Retrieve props.
		const {
			field
		} = target.dataset;

		// Prepare variables.
		let rollData = {};

		// Retrieve pool.
		let pool = this.document.system?.[field] ?? null;

		// Handle roll.
		if (pool.diceNum > 0) {
			const roll = new grimwild.diePools(`{${pool.diceNum}d6}`, rollData);
			const result = await roll.evaluate();
			const dice = result.dice[0].results;
			const dropped = dice.filter((die) => die.result < 4);

			// Initialize chat data.
			const speaker = ChatMessage.getSpeaker({ actor: this.actor });
			const rollMode = game.settings.get("core", "rollMode");
			const label = `[${field}] ${this.document.name}`;
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
			// Recalculate the pool value.
			pool.diceNum -= dropped.length;
			// Otherwise, update the condition.
			await this.document.update({
				[`system.${field}`]: pool
			});
		}
	}

	/**
	 * Handle updating pools on embedded challenge items.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _updateChallengePool(event, target) {
		event.preventDefault();
		// Retrieve props.
		const { itemId } = target.dataset;

		// Handle locked documents.
		if (!this.isEditable) return;

		// Retrieve the item.
		const item = this.document.items.get(itemId);
		if (!item) return;

		// Update value.
		await item.update({ "system.pool.diceNum": Number(target.value) });
	}
}
