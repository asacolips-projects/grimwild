import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueItemSheet } from "./_vue/_base-vue-item-sheet.mjs";
import { ItemSheetVue } from "../../vue/components.vue.es.mjs";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildItemSheetVue extends VueRenderingMixin(GrimwildBaseVueItemSheet) {
	vueParts = {
		"item-sheet": {
			component: ItemSheetVue,
			template: "<item-sheet :context=\"context\">Vue rendering for sheet failed.</item-sheet>"
		}
	};

	constructor(options = {}) {
		super(options);
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "item"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 478
			// height: 720,
		},
		window: {
			resizable: true,
			controls: [
				{
					action: "showItemArtwork",
					icon: "fa-solid fa-image",
					label: "ITEM.ViewArt",
					ownership: "OWNER"
				}
			]
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
		},
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
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
			// Force re-renders. Defined in the vue mixin.
			_renderKey: this._renderKey ?? 0,
			// Necessary for formInput and formFields helpers
			fields: this.document.schema.fields,
			systemFields: this.document.system.schema.fields
		};

		// Handle tabs.
		this._prepareTabs(context);

		// Handle enriched fields.
		const enrichmentOptions = {
			// Whether to show secret blocks in the finished html
			secrets: this.document.isOwner,
			// Data to fill in for inline rolls
			rollData: this.item.getRollData() ?? {},
			// Relative UUID resolution
			relativeTo: this.item
		};

		const editorOptions = {
			toggled: true,
			collaborate: true,
			documentUUID: this.document.uuid,
			height: 200
		};

		// Handle enriching fields.
		context.editors = {};
		await this._enrichFields(context, enrichmentOptions, editorOptions);

		// Make another pass through the editors to fix the element contents.
		for (let [field, editor] of Object.entries(context.editors)) {
			if (context.editors?.[field].element) {
				context.editors[field].element.innerHTML = context.editors[field].enriched;
			}
		}

		// Debug. @todo remove.
		// console.log('context', context);

		return context;
	}

	/**
	 * Enrich values for action fields.
	 *
	 * @param {object} context
	 * @param {object} enrichmentOptions
	 * @param {object} editorOptions
	 */
	async _enrichFields(context, enrichmentOptions, editorOptions) {
		// Enrich other fields.
		const fields = [
			"description",
			"notes.description"
		];

		for (let field of fields) {
			const editorValue = this.item.system?.[field] ?? foundry.utils.getProperty(this.item.system, field);
			context.editors[`system.${field}`] = {
				enriched: await TextEditor.enrichHTML(editorValue, enrichmentOptions),
				element: foundry.applications.elements.HTMLProseMirrorElement.create({
					...editorOptions,
					name: `system.${field}`,
					value: editorValue ?? ""
				})
			};
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
			active: true
		};

		// Tabs limited to Monsters.
		context.tabs.primary.attributes = {
			key: "attributes",
			label: game.i18n.localize("GRIMWILD.Item.Tabs.Attributes"),
			active: false
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
	 * @this GrimwildActorSheet
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
	 * @this GrimwildActorSheet
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
	 * Handle creating a new bond entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createArrayEntry(event, target) {
		event.preventDefault();
		const {
			field,
			fieldType,
			count
		} = target.dataset;

		// Retrieve the current field value.
		const entries = !field.startsWith("system.")
			? this.document.system[field]
			: foundry.utils.getProperty(this.document, field);
		// Retrieve the schema.
		const schema = this.document.system.schema.fields?.[field];
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

		// If we're adding multiple entries at once, such as an 6 strings,
		// handle that now.
		let entry = null;
		if (count) {
			entry = [];
			for (let i = 0; i < count; i++) {
				entry.push(defaultValue);
			}
		}
		else {
			entry = defaultValue;
		}

		// Push the new entry.
		entries.push(entry);

		// Build our final data.
		let updateData = null;
		let systemField = field;
		if (field.startsWith("system.")) {
			systemField = field.split(".")[1];
			updateData = this.document.system[systemField];
			foundry.utils.setProperty(updateData, field.split("system.")[1], entries);
		}
		else {
			updateData = entries;
		}

		// Perform the update.
		await this.document.update({
			[`system.${field}`]: entries
		});
		this._arrayEntryKey++;
		this.render();
	}

	/**
	 * Handle deleting an existing bond entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteArrayEntry(event, target) {
		event.preventDefault();
		const {
			field,
			key
		} = target.dataset;
		// Retrieve the current field value.
		const entries = !field.startsWith("system.")
			? this.document.system[field]
			: foundry.utils.getProperty(this.document, field);
		entries.splice(key, 1);

		// Build our final data.
		let updateData = null;
		let systemField = field;
		if (field.startsWith("system.")) {
			systemField = field.split(".")[1];
			updateData = this.document.system[systemField];
			foundry.utils.setProperty(updateData, field.split("system.")[1], entries);
		}
		else {
			updateData = entries;
		}

		// Perform the update.
		await this.document.update({
			[`system.${field}`]: entries
		});
		this._arrayEntryKey++;
		this.render(true);
	}

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
			field,
			key
		} = target.dataset;

		// Prepare variables.
		let pool = null;
		let rollData = {};
		let fieldData = null;

		// Retrieve pool.
		fieldData = this.document.system?.[field] ?? null;
		if (!fieldData) return;
		pool = !fieldData?.diceNum ? fieldData?.[key]?.pool : fieldData;
		if (!pool?.diceNum) return;

		// Handle roll.
		if (pool.diceNum > 0) {
			const roll = new grimwild.diePools(`{${pool.diceNum}d6}`, rollData);
			const result = await roll.evaluate();
			const dice = result.dice[0].results;
			const dropped = dice.filter((die) => die.result < 4);

			// Initialize chat data.
			const speaker = ChatMessage.getSpeaker({ actor: this?.actor ?? game.user?.character });
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
			if (fieldData?.diceNum) {
				// Otherwise, update the condition.
				await this.document.update({
					[`system.${field}`]: pool
				});
			}
			else {
				fieldData[key].pool = pool;
				const update = {};
				update[`system.${field}`] = fieldData;
				await this.document.update({
					[`system.${field}`]: fieldData
				});
			}
		}
	}
}
