import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueActorSheet } from "./_vue/_base-vue-actor-sheet.mjs";
import { DocumentSheetVue } from "../../vue/components.vue.es.mjs";

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorSheetVue extends VueRenderingMixin(GrimwildBaseVueActorSheet) {
	vueParts = {
		"document-sheet": {
			component: DocumentSheetVue,
			template: "<document-sheet :context=\"context\">Vue rendering for sheet failed.</document-sheet>"
		}
	};

	enrichmentOptions = {
		documentFields: [
			"biography",
			"notes"
		],
		itemFields: {
			talent: [
				"description",
				"notes.description"
			]
		}
	};

	_arrayEntryKey = 0;

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor", "character"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 820,
			height: 750
		},
		window: {
			resizable: true,
			controls: [
				{
					action: "configurePrototypeToken",
					icon: "fa-solid fa-user-circle",
					label: "TOKEN.TitlePrototype",
					ownership: "OWNER"
				},
				{
					action: "showPortraitArtwork",
					icon: "fa-solid fa-image",
					label: "SIDEBAR.CharArt",
					ownership: "OWNER"
				},
				{
					action: "showTokenArtwork",
					icon: "fa-solid fa-image",
					label: "SIDEBAR.TokenArt",
					ownership: "OWNER"
				}
			]
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
			openPack: this._openPack,
			createArrayEntry: this._createArrayEntry,
			deleteArrayEntry: this._deleteArrayEntry,
			changeXp: this._changeXp,
			updateTalentTracker: this._updateTalentTracker,
			rollPool: this._rollPool,
			roll: this._onRoll
		},
		changeActions: {
			updateTalentTracker: this._updateTalentTracker
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

	/**
	 * Attach listeners to the application frame.
	 */
	_attachFrameListeners() {
		super._attachFrameListeners();
		// Attach event listeners in here to prevent duplicate calls.
		const change = this.#onChange.bind(this);
		this.element.addEventListener("change", change);
	}

	/**
	 * Change event actions in this.options.changeActions.
	 *
	 * Functionally similar to this.options.actions and fires callbacks
	 * specified in data-action-change on the element(s).
	 *
	 * @param {ChangeEvent} event Change event that triggered the call.
	 */
	async #onChange(event) {
		const target = event.target;
		const changeElement = target.closest("[data-action-change]");
		if (changeElement) {
			const { actionChange } = changeElement.dataset;
			if (actionChange) {
				this.options.changeActions?.[actionChange]?.call(
					this,
					event,
					changeElement
				);
			}
		}
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
		const fields = this.enrichmentOptions.documentFields;
		const itemTypes = this.enrichmentOptions.itemFields;

		// Enrich actor fields.
		for (let field of fields) {
			const editorValue = this.actor.system?.[field] ?? foundry.utils.getProperty(this.actor.system, field);
			context.editors[`system.${field}`] = {
				enriched: await TextEditor.enrichHTML(editorValue, enrichmentOptions),
				element: foundry.applications.elements.HTMLProseMirrorElement.create({
					...editorOptions,
					name: `system.${field}`,
					value: editorValue ?? ""
				})
			};
		}

		// Enrich item fields.
		for (let [type, itemFields] of Object.entries(itemTypes)) {
			if (this.document.itemTypes[type]) {
				// Iterate over the items.
				for (let item of this.document.itemTypes[type]) {
					// Handle enriched fields.
					const itemEnrichmentOptions = {
						secrets: item.isOwner,
						rollData: item.getRollData() ?? this.actor.getRollData(),
						relativeTo: item
					};
					// Iterate over each field within those items.
					for (let itemField of itemFields) {
						// Retrieve and enrich the field. Ignore creating prosemirror editors
						// since those should be edited directly on the item.
						const editorValue = item.system?.[itemField]
							?? foundry.utils.getProperty(item.system, itemField);
						// Add editor settings.
						context.editors[`items.${item.id}.system.${itemField}`] = {
							enriched: await TextEditor.enrichHTML(editorValue, itemEnrichmentOptions),
							element: null
						};
					}
				}
			}
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

		// Tabs limited to characters.
		if (this.actor.type === "character") {
			context.tabs.primary.details = {
				key: "details",
				label: game.i18n.localize("GRIMWILD.Actor.Tabs.Details"),
				active: true
			};

			context.tabs.primary.talents = {
				key: "talents",
				label: game.i18n.localize("GRIMWILD.Actor.Tabs.Talents"),
				active: false
			};
		}

		// Tabs available to all actors.
		context.tabs.primary.biography = {
			key: "biography",
			label: game.i18n.localize("GRIMWILD.Actor.Tabs.Biography"),
			active: false
		};

		context.tabs.primary.notes = {
			key: "notes",
			label: game.i18n.localize("GRIMWILD.Actor.Tabs.Notes"),
			active: false
		};

		// @todo Active Effects disabled for now. Will revisit in the
		// future.

		// More tabs available to all actors.
		// context.tabs.primary.effects = {
		// 	key: "effects",
		// 	label: game.i18n.localize("GRIMWILD.Actor.Tabs.Effects"),
		// 	active: false,
		// };

		// Ensure we have a default tab.
		if (this.actor.type !== "character") {
			context.tabs.primary.details.active = true;
		}
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	static async _openPack(event, target) {
		event.preventDefault();
		const { pack } = target.dataset;
		const compendium = game.packs.get(pack);

		if (compendium?.apps?.[0]) {
			// Open the character's relevant path, if one exists.
			const path = this.document.system.path;
			const folder = compendium.folders.find((f) => {
				return f.name.trim().toLocaleLowerCase() === path.trim().toLocaleLowerCase();
			});
			if (folder) {
				const otherFolders = compendium.folders.filter((f) => f.id !== folder.id);
				game.folders._expanded[folder.uuid] = true;
				otherFolders.forEach((f) => game.folders._expanded[f.uuid] = false);
			}
			// Render the pack.
			compendium.apps[0].render(true);
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
	 * Handle changing XP via the checkbox pips.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _changeXp(event, target) {
		event.preventDefault();
		const dataset = target.dataset;
		if (dataset.xp) {
			// Retrieve incoming XP.
			const xp = Number(dataset.xp);
			// Determine if we should use the new XP value, or
			// decrement it so that it behaves like a toggle.
			const newXp = xp !== this.document.system.xp.value
				? xp
				: this.document.system.xp.value - 1;
			await this.document.update({ "system.xp.value": newXp });
		}
	}

	/**
	 * Handle updating talent trackers.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _updateTalentTracker(event, target) {
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
		const item = this.document.items.get(itemId);
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
			itemId,
			field,
			key
		} = target.dataset;

		// Prepare variables.
		let item = null;
		let trackers = null;
		let tracker = null;
		let pool = null;
		let rollData = {};
		let fieldData = null;

		// Handle item pools (talents).
		if (itemId) {
			item = this.document.items.get(itemId);
			if (!item) return;
			trackers = item.system.trackers;
			tracker = trackers?.[key];
			if (!tracker) return;
			pool = tracker.pool;
			rollData = item.getRollData();
		}
		// Handle condition pools.
		else {
			fieldData = this.document.system?.[field] ?? null;
			if (!fieldData) return;
			pool = key !== undefined ? fieldData[key]?.pool : fieldData?.pool;
			if (!pool.diceNum) return;
		}

		// Handle roll.
		if (pool.diceNum > 0) {
			const roll = new grimwild.diePools(`{${pool.diceNum}d6}`, rollData);
			const result = await roll.evaluate();
			const dice = result.dice[0].results;
			const dropped = dice.filter((die) => die.result < 4);

			// Initialize chat data.
			const speaker = ChatMessage.getSpeaker({ actor: this.actor });
			const rollMode = game.settings.get("core", "rollMode");
			const label = item
				? `[${item.type}] ${item.name}`
				: `[${field}] ${fieldData[key]?.name ?? ""}`;
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
			// Update the item.
			if (item) {
				trackers[key].pool = pool;
				await item.update({ "system.trackers": trackers });
			}
			// Otherwise, update the condition.
			else if (fieldData) {
				if (key !== undefined) {
					fieldData[key].pool = pool;
				}
				else {
					fieldData.pool = pool;
				}
				const update = {};
				update[`system.${field}`] = fieldData;
				await this.document.update({
					[`system.${field}`]: fieldData
				});
			}
		}
	}

	/**
	 * Handle clickable rolls.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise|void} The roll object, or void.
	 * @protected
	 */
	static async _onRoll(event, target) {
		event.preventDefault();
		const dataset = target.dataset;
		let item = null;

		// Handle item rolls.
		switch (dataset.rollType) {
			case "item":
				item = this._getEmbeddedDocument(target);
				if (item) return item.roll();
				break;
			case "stat":
				await this.document.system.roll({ stat: dataset.stat }, event);
				break;
		}

		// Handle rolls that supply the formula directly.
		if (dataset.roll) {
			let label = dataset.label ? `[stat] ${dataset.label}` : "";
			let roll = new Roll(dataset.roll, this.actor.getRollData());
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
				rollMode: game.settings.get("core", "rollMode")
			});
			return roll;
		}
	}
}
