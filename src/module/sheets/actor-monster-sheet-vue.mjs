import { MonsterSheetVue } from "../../vue/components.vue.es.mjs";
import { GrimwildActorSheetVue } from "./actor-sheet-vue.mjs";
import { rollPoolDice } from "./_vue/_shared-actions.mjs";

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
			height: 640
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
			updateItemField: this._updateItemField,
			updateChallengePool: this._updateChallengePool
		},
		form: {
			submitOnChange: true,
			submitOnClose: true
		}
	};

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

		// Handle enriching fields.
		context.editors = {};
		await this._enrichFields(context, enrichmentOptions);

		// Handle other custom elements. Exposed as metadata only; the
		// ColorPicker component creates the element for editable sheets.
		if (this.document.type === "monster") {
			context.customElements = {};
			for (let [colorKey, color] of this.document.system.sensories.colors.entries()) {
				context.customElements[`system.sensories.colors.${colorKey}.color`] = {
					name: `system.sensories.colors.${colorKey}.color`,
					value: color.color
				};
			}
		}

		Hooks.callAll("grimwildActorMonsterSheetVuePrepareContext", this, context);

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
		if (this.document.type === "monster") {
			context.tabs.primary.biography = {
				key: "biography",
				label: game.i18n.localize("GRIMWILD.Actor.Tabs.Biography"),
				active: false
			};
		}

		context.tabs.primary.moves = {
			key: "moves",
			label: "Traits / Moves",
			active: false
		};

		if (this.document.type === "monster") {
			context.tabs.primary.tables = {
				key: "tables",
				label: "Tables",
				active: false
			};
		}

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
	 * Handle rolling pools on the monster sheet.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _rollPool(event, target) {
		event.preventDefault();
		// Retrieve props.
		const {
			field,
			key,
			itemId
		} = target.dataset;

		// Retrieve pool.
		// @todo improve this to work with more nested field types.
		const item = itemId ? this.document.items.get(itemId) : false;
		const pool = !item
			? (this.document.system?.[field] ?? null)
			: (item.system?.[field]?.[key]?.pool ?? null);
		if (!pool?.diceNum) return;

		// Roll the pool and send it to chat.
		const droppedCount = await rollPoolDice({
			diceNum: pool.diceNum,
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			label: `[${field}] ${this.document.name}`
		});

		// Recalculate the pool value and persist.
		pool.diceNum -= droppedCount;
		if (!item) {
			await this.document.update({
				[`system.${field}`]: pool
			});
		}
		else {
			const update = item.system.toObject()[field];
			update[key].pool = pool;
			await item.update({ [`system.${field}`]: update });
		}
	}

	/**
	 * Handle updating fields on embedded documents.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action-change]
	 * @private
	 */
	static async _updateItemField(event, target) {
		event.preventDefault();
		const { field, itemId, key } = target.dataset;

		// Handle locked documents.
		if (!this.isEditable) return;

		// Retrieve the item.
		const item = this.document.items.get(itemId);
		if (!item) return;

		// @todo handle more field types.
		// Handle value.
		let value = null;
		switch (target.type) {
			case "checkbox":
				value = target.checked;
				break;

			default:
				value = target.value;
				break;
		}

		// Prepare the update.
		let update = null;
		// Handle array fields.
		if (key !== undefined) {
			update = foundry.utils.getProperty(item.toObject(), field);
			update[Number(key)] = value;
		}
		// Handle other fields.
		else {
			update = value;
		}

		// Update the value.
		await item.update({ [field]: update });

	}

	/**
	 * Handle updating pools on embedded challenge items.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action-change]
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
