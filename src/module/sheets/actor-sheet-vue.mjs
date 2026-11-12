import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueActorSheet } from "./_vue/_base-vue-actor-sheet.mjs";
import { createArrayEntry, deleteArrayEntry, rollPoolDice, updateItemTracker, rollItemTrackerPool } from "./_vue/_shared-actions.mjs";
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
			],
			gear: [
				"description",
				"notes.description"
			]
		}
	};

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor", "character"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 820,
			height: 760
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
		form: {
			submitOnChange: true,
			submitOnClose: true
		}
	};

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

		// Handle the custom harm homebrew.
		if (game.settings.get("grimwild", "enableHarmPools")) {
			context.harmEnabled = true;
			context.maxBloodied = game.settings.get("grimwild", "maxBloodied");
			context.maxRattled = game.settings.get("grimwild", "maxRattled");
			context.maxDesperate = game.settings.get("grimwild", "maxDesperate");
		}

		// Handle the Community Edition rules.
		if (game.settings.get("grimwild", "ceRules")) {
			context.ceRulesEnabled = true;
		}

		// Handle the CE optional encumbrance rules. Each gates its own
		// character sheet display.
		if (game.settings.get("grimwild", "enableEncumbrance")) {
			context.encumbranceEnabled = true;
		}
		if (game.settings.get("grimwild", "enableCoins")) {
			context.coinsEnabled = true;
		}
		if (game.settings.get("grimwild", "enableSupplies")) {
			context.suppliesEnabled = true;
		}
		if (game.settings.get("grimwild", "enableVigor")) {
			context.vigorEnabled = true;
			context.maxVigor = game.settings.get("grimwild", "maxVigor") ?? 3;
		}

		Hooks.callAll("grimwildActorSheetVuePrepareContext", this, context);

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
		const fields = this.enrichmentOptions.documentFields;
		const itemTypes = this.enrichmentOptions.itemFields;

		// Enrich actor fields.
		for (let field of fields) {
			const editorValue = this.actor.system?.[field] ?? foundry.utils.getProperty(this.actor.system, field);
			const editor = {
				enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
					editorValue,
					enrichmentOptions
				)
			};
			if (this.isEditable) {
				editor.name = `system.${field}`;
				editor.value = editorValue ?? "";
				editor.height = 300;
			}
			context.editors[`system.${field}`] = editor;
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
					// Iterate over each field within those items. These are enriched
					// text only - ProseMirror editors for them should be edited
					// directly on the item.
					for (let itemField of itemFields) {
						const editorValue = item.system?.[itemField]
							?? foundry.utils.getProperty(item.system, itemField);
						context.editors[`items.${item.id}.system.${itemField}`] = {
							enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
								editorValue,
								itemEnrichmentOptions
							)
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

			context.tabs.primary.gear = {
				key: "gear",
				label: game.i18n.localize("GRIMWILD.Actor.Tabs.Gear"),
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
	 * Handle creating a new array entry.
	 *
	 * @this GrimwildActorSheetVue
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
	 * @this GrimwildActorSheetVue
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteArrayEntry(event, target) {
		await deleteArrayEntry(this, event, target);
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
			// XP can never drop below zero.
			newXp = Math.max(0, newXp);
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
		await updateItemTracker(this, event, target);
	}

	/**
	 * Handle rolling pools on the character sheet.
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

		// Tracker pools on embedded items (shared with item sheets).
		if (itemId) {
			await rollItemTrackerPool(this, itemId, key);
			return;
		}

		// Handle condition pools.
		const fieldData = this.document.system?.[field] ?? null;
		if (!fieldData) return;
		const pool = key !== undefined ? fieldData[key]?.pool : fieldData?.pool;
		if (!pool.diceNum) return;

		// Handle vigor optional rule.
		if (field === "vigor") {
			// Clear desperate first.
			if (this.actor.system.isDesperate) {
				this.document.update({
					[`system.desperate.marked`]: false,
					[`system.desperate.pool.diceNum`]: 0
				})
			}
			// Clear bloodied if rattled is empty.
			else if (this.actor.system.isBloodied && !this.actor.system.isRattled) {
				this.document.update({
					[`system.bloodied.marked`]: false,
					[`system.bloodied.pool.diceNum`]: 0
				});
			}
			// Clear rattled if bloodied is empty.
			else if (this.actor.system.isRattled && !this.actor.system.isBloodied) {
				this.document.update({
					[`system.rattled.marked`]: false,
					[`system.rattled.pool.diceNum`]: 0
				});
			}
			// Otherwise prompt for which to clear.
			else {
				const vigorDialog = await foundry.applications.api.DialogV2.wait({
					position: {width: 400},
					window: { title: "GRIMWILD.Dialog.RollVigorTitle" },
					content: `
						<label><input type="radio" name="choice" value="bloodied" checked> ${game.i18n.localize("GRIMWILD.Damage.bloodied")}</label>
						<label><input type="radio" name="choice" value="rattled"> ${game.i18n.localize("GRIMWILD.Damage.rattled")}</label>
					`,
					buttons: [{
						action: "confirm",
						label: "COMMON.Confirm",
						icon: "fa-solid fa-check",
						default: true,
						callback: (event, button, dialog) => button.form.elements.choice.value
					}, {
						action: "cancel",
						label: "COMMON.Cancel",
						icon: "fa-solid fa-xmark",
						callback: () => false
					}],
					submit: result => {
						if ( result === "cancel" ) return false;
						else {
							this.document.update({
								[`system.${result}.marked`]: false,
								[`system.${result}.pool.diceNum`]: 0
							});
							return true;
						}
					},
				});
				// Prevent the pool roll if exiting early.
				if (!vigorDialog || vigorDialog === "cancel") return;
			}
		}

		// Roll the pool and shed dropped dice.
		if (pool.diceNum > 0) {
			const label = `[${field}] ${fieldData[key]?.name ?? ""}`;
			const droppedCount = await rollPoolDice({
				diceNum: pool.diceNum,
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				label
			});

			// Recalculate the pool value.
			pool.diceNum -= droppedCount;
			if (key !== undefined) {
				fieldData[key].pool = pool;
			}
			else {
				fieldData.pool = pool;
			}
			await this.document.update({ [`system.${field}`]: fieldData });
		}
	}

	/**
	 * Handle clickable rolls.
	 *
	 * @this GrimwildActorSheetVue
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
				flavor: label
			});
			return roll;
		}
	}
}
