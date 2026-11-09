import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueItemSheet } from "./_vue/_base-vue-item-sheet.mjs";
import { createArrayEntry, deleteArrayEntry, rollPoolDice } from "./_vue/_shared-actions.mjs";
import { ItemSheetVue } from "../../vue/components.vue.es.mjs";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildItemSheetVue extends VueRenderingMixin(GrimwildBaseVueItemSheet) {
	vueParts = {
		"item-sheet": {
			component: ItemSheetVue,
			template: "<item-sheet :context=\"context\">Vue rendering for sheet failed.</item-sheet>"
		}
	};

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "item"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 600
		},
		window: {
			resizable: true
		},
		tag: "form",
		actions: {
			onEditImage: this._onEditImage,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			createTracker: this._createTracker,
			deleteTracker: this._deleteTracker,
			createArrayEntry: this._createArrayEntry,
			deleteArrayEntry: this._deleteArrayEntry,
			rollPool: this._rollPool
			// @TODO restore when crucibles are added back to talents.
			// rollCrucible: this._rollCrucible
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
			// Documents.
			item: this.item.toObject(),
			actor: this.actor?.toObject() ?? false,
			// Add the actor's data to context.data for easier access, as well as flags.
			system: this.item.system,
			flags: this.item.flags,
			// Roll data.
			rollData: this.item.getRollData() ?? {},
			// Adding a pointer to CONFIG.GRIMWILD
			config: CONFIG.GRIMWILD,
			// Necessary for formInput and formFields helpers
			fields: this.document.schema.fields,
			systemFields: this.document.system.schema.fields
		};

		// Handle tabs.
		this._prepareTabs(context);

		// Expose color picker metadata for the arcana palette. Exposed as
		// metadata only; the ColorPicker component creates the element for
		// editable sheets.
		if (this.document.type === "arcana") {
			context.customElements = {};
			for (const [colorKey, color] of (this.document.system.palette ?? []).entries()) {
				context.customElements[`system.palette.${colorKey}.color`] = {
					name: `system.palette.${colorKey}.color`,
					value: color.color
				};
			}
		}

		// Handle enriched fields.
		const enrichmentOptions = {
			// Whether to show secret blocks in the finished html
			secrets: this.document.isOwner,
			// Data to fill in for inline rolls
			rollData: this.item.getRollData() ?? {},
			// Relative UUID resolution
			relativeTo: this.item
		};

		// Handle enriching fields.
		context.editors = {};
		await this._enrichFields(context, enrichmentOptions);

		Hooks.callAll("grimwildItemSheetVuePrepareContext", this, context);

		return context;
	}

	/**
	 * Enrich values for editable document fields.
	 *
	 * Editors are exposed to Vue as metadata only; the ProseMirror element
	 * itself is created and owned by the Prosemirror component. Non-editable
	 * viewers only receive the enriched HTML.
	 *
	 * @param {object} context
	 * @param {object} enrichmentOptions
	 */
	async _enrichFields(context, enrichmentOptions) {
		// Enrich other fields.
		const fields = [
			"description",
			"notes.description",
			"limitations"
		];

		for (let field of fields) {
			const editorValue = this.item.system?.[field] ?? foundry.utils.getProperty(this.item.system, field);
			const editor = {
				enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					editorValue,
					enrichmentOptions
				)
			};
			if (this.isEditable) {
				editor.name = `system.${field}`;
				editor.value = editorValue ?? "";
				editor.height = 200;
			}
			context.editors[`system.${field}`] = editor;
		}
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

		// Tabs available to all items.
		context.tabs.primary.description = {
			key: "description",
			label: game.i18n.localize("GRIMWILD.Item.Tabs.Description"),
			active: this.document.type !== "challenge"
		};

		// Tabs limited to Monsters.
		context.tabs.primary.attributes = {
			key: "attributes",
			label: game.i18n.localize("GRIMWILD.Item.Tabs.Attributes"),
			active: this.document.type === "challenge"
		};

		// @todo Active Effects disabled for now. Will revisit in the
		// future.

		// // More tabs available to all items.
		// context.tabs.primary.effects = {
		// 	key: "effects",
		// 	label: game.i18n.localize("GRIMWILD.Item.Tabs.Effects"),
		// 	active: false
		// };
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle creating a new tracker entry.
	 *
	 * @this GrimwildItemSheetVue
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createTracker(event, target) {
		event.preventDefault();
		const trackers = this.document.system.trackers;
		if (!trackers) return;

		trackers.push({
			type: "points",
			points: {
				value: 1,
				max: 1,
				showSteps: true
			}
		});
		await this.document.update({ "system.trackers": trackers });
	}

	/**
	 * Handle deleting an existing tracker entry.
	 *
	 * @this GrimwildItemSheetVue
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteTracker(event, target) {
		event.preventDefault();
		const { key } = target.dataset;
		if (key) {
			const trackers = this.document.system.trackers;
			if (!trackers) return;

			trackers.splice(Number(key), 1);

			await this.document.update({ "system.trackers": trackers });
		}
	}

	/**
	 * Handle creating a new array entry.
	 *
	 * @this GrimwildItemSheetVue
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createArrayEntry(event, target) {
		await createArrayEntry(this, event, target);
	}

	/**
	 * Handle deleting an existing array entry.
	 *
	 * @this GrimwildItemSheetVue
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteArrayEntry(event, target) {
		await deleteArrayEntry(this, event, target);
	}

	/**
	 * Handle rolling pools on the item sheet.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _rollPool(event, target) {
		event.preventDefault();
		// Retrieve props.
		const { field, key } = target.dataset;

		// Retrieve pool.
		const fieldData = this.document.system?.[field] ?? null;
		if (!fieldData) return;
		const pool = !fieldData?.diceNum ? fieldData?.[key]?.pool : fieldData;
		if (!pool?.diceNum) return;

		// Roll the pool and send it to chat.
		const droppedCount = await rollPoolDice({
			diceNum: pool.diceNum,
			speaker: ChatMessage.getSpeaker({ actor: this?.actor ?? game.user?.character }),
			label: `[${field}] ${this.document.name}`
		});

		// Recalculate the pool value and persist.
		pool.diceNum -= droppedCount;
		if (fieldData?.diceNum) {
			await this.document.update({
				[`system.${field}`]: pool
			});
		}
		else {
			fieldData[key].pool = pool;
			await this.document.update({
				[`system.${field}`]: fieldData
			});
		}
	}

	// @TODO restore when crucibles are added back to talents.
	// /**
	//  * Handle rolling crucibles on the item sheet.
	//  *
	//  * @param {PointerEvent} event The originating click event
	//  * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	//  * @private
	//  */
	// static async _rollCrucible(event, target) {
	// 	event.preventDefault();
	// 	await this.document.system.rollCrucible({ toMessage: true });
	// }
}
