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
			],
			arcana: [
				"description",
				"notes.description",
				"limitations"
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
			openPack: this._openPack,
			createArrayEntry: this._createArrayEntry,
			deleteArrayEntry: this._deleteArrayEntry,
			changeXp: this._changeXp,
			updateItemTracker: this._updateItemTracker,
			rollPool: this._rollPool,
			roll: this._onRoll
		},
		changeActions: {
			updateItemTracker: this._updateItemTracker
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

		// Handle the custom harm homebrew.
		if (game.settings.get("grimwild", "enableHarmPools")) {
			context.enableHarm = true;
			context.maxBloodied = game.settings.get("grimwild", "maxBloodied");
			context.maxRattled = game.settings.get("grimwild", "maxRattled");
		}

		Hooks.callAll("grimwildActorSheetVuePrepareContext", this, context);

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
				enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					editorValue,
					enrichmentOptions
				),
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
							enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
								editorValue,
								itemEnrichmentOptions
							),
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

			context.tabs.primary.arcana = {
				key: "arcana",
				label: game.i18n.localize("GRIMWILD.Actor.Tabs.Arcana"),
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
				otherFolders.forEach((f) => delete game.folders._expanded[f.uuid]);
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
		const slowXp = game.settings.get("grimwild", "slowXp");
		const actorXp = this.document.system.xp.value;
		if (dataset.xp) {
			// Retrieve incoming XP.
			const xp = Number(dataset.xp);
			// Determine if we should use the new XP value, or
			// decrement it so that it behaves like a toggle.
			let newXp = xp;
			// If it's equal to the pip, we need to decrement it to the
			// previous pip.
			if (xp === actorXp) {
				newXp = (slowXp) ? xp - 2 : xp - 1;
			}
			// If it's less than the pip, we need to increase it.
			else if (actorXp < xp) {
				// Slow XP requires two clicks to max.
				if (slowXp) {
					newXp = actorXp < xp - 1 ? xp - 1 : xp;
				}
				// Fast XP is one click.
				else {
					newXp = xp;
				}
			}
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
	static async _updateItemTracker(event, target) {
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
		let dropped = [];
		const update = {};

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
			if (tracker.pool.powerPool) {
				const options = {};
				const rollData = this.actor.getRollData();
				const rollDialog = await grimwild.applications.GrimwildRollDialog.open({
					rollData: {
						name: this.actor.name,
						spark: rollData?.spark,
						stat: null,
						diceLabel: `[${item.name}] ${tracker.label}`,
						diceDefault: pool.diceNum,
						isBloodied: rollData?.isBloodied,
						isRattled: rollData?.isRattled,
						isMarked: false,
						actor: this.actor
					}
				});
				if (rollDialog === null) {
					return;
				}

				rollData.thorns = rollDialog.thorns;
				rollData.statDice = rollDialog.dice;
				options.assists = rollDialog.assisters;
				options.pool = tracker.pool;
				const formula = `{${rollData.statDice}d6kh, ${rollData.thorns}d8}`;
				const roll = new grimwild.roll(formula, rollData, options);
				const result = await roll.evaluate();
				// Limit to just the pool dice when checking for dropped dice.
				const dice = result.dice[0].results.slice(0, pool.diceNum);
				dropped = dice.filter((die) => die.result < 4);

				// Add spark to the update.
				if (rollDialog.sparkUsed > 0) {
					let sparkUsed = rollDialog.sparkUsed;
					const newSpark = {
						steps: this.document.system.spark.steps
					};
					// All of your spark is used.
					if (sparkUsed > 1 || this.document.system.spark.value === 1) {
						newSpark.steps[0] = false;
						newSpark.steps[1] = false;
					}
					// If half of your spark is used.
					else if (sparkUsed === 1 && this.document.system.spark.value > 1) {
						newSpark.steps[0] = true;
						newSpark.steps[1] = false;
					}
					update["system.spark"] = newSpark;
				}

				// Initialize chat data.
				const speaker = ChatMessage.getSpeaker({ actor: this.actor });
				const rollMode = game.settings.get("core", "rollMode");
				const label = item && tracker.label
					? `[${item.name}] ${tracker.label}`
					: (item ? item.name : `[${field}] ${fieldData[key]?.name ?? ""}`);
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
				// Update the action count.
				for (const combat of game.combats) {
					const combatant = combat?.getCombatantsByActor(this.actor.id)?.[0] || null;
					if (combatant) {
						const actionCount = Number(combatant.flags?.grimwild?.actionCount ?? 0);
						await combatant.setFlag("grimwild", "actionCount", actionCount + 1);
						update["system.tokenActions.value"] = Math.max(this.actor.system.tokenActions.value - 1, 0);

						// Update the active turn.
						const combatantTurn = combat.turns.findIndex((c) => c.id === combatant.id);
						if (combatantTurn !== undefined) {
							combat.update({ turn: combatantTurn });
						}
					}
				}
			}
			else {
				const roll = new grimwild.diePools(`{${pool.diceNum}d6}`, rollData);
				const result = await roll.evaluate();
				const dice = result.dice[0].results;
				dropped = dice.filter((die) => die.result < 4);

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
				update[`system.${field}`] = fieldData;
			}

			// Handle actor updates.
			if (Object.keys(update).length > 0) {
				await this.document.update(update);
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
				await this.document.system.roll({ stat: dataset.stat });
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
