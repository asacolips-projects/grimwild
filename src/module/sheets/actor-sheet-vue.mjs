import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueActorSheet } from "./_vue/_base-vue-actor-sheet.mjs";
import { DocumentSheetVue } from '../../vue/components.vue.es.mjs';

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorSheetVue extends VueRenderingMixin(GrimwildBaseVueActorSheet) {
	vueParts = {
		'document-sheet': {
			component: DocumentSheetVue,
			template: `<document-sheet :context="context">Vue rendering for sheet failed.</document-sheet>`
		}
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 800,
			height: 720,
		},
		window: {
			resizable: true,
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
			createBond: this._createBond,
			deleteBond: this._deleteBond,
			changeXp: this._changeXp,
			roll: this._onRoll
		},
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		form: {
			submitOnChange: true,
			submitOnClose: true,
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
			// Force re-renders. Defined in the vue mixin.
			_renderKey: this._renderKey ?? 0,
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
			height: 300,
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

		// Character context.
		if (this.document.type === "character") {
			context.classes = CONFIG.GRIMWILD.classes;
		}

		// Debug. @todo remove.
		console.log('context', context);

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
			'biography',
		];

		// Enrich items.
		const itemTypes = {
			talent: [
				'description',
				'notes.description',
			],
		};

		// Enrich actor fields.
		for (let field of fields) {
			const editorValue = this.actor.system?.[field] ?? foundry.utils.getProperty(this.actor.system, field);
			context.editors[`system.${field}`] = {
				enriched: await TextEditor.enrichHTML(editorValue, enrichmentOptions),
				element: foundry.applications.elements.HTMLProseMirrorElement.create({
					...editorOptions,
					name: `system.${field}`,
					value: editorValue ?? '',
				}),
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
						const editorValue = item.system?.[itemField] ?? foundry.utils.getProperty(item.system, itemField);
						context.editors[`items.${item.id}.system.${itemField}`] = {
							enriched: await TextEditor.enrichHTML(editorValue, itemEnrichmentOptions),
							element: null,
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
			primary: {},
		};

		// Tabs available to all actors.
		context.tabs.primary.details = {
			key: 'details',
			label: game.i18n.localize('GRIMWILD.Actor.Tabs.Details'),
			active: false,
		};

		// Tabs limited to NPCs.
		if (this.actor.type === 'character') {
			context.tabs.primary.talents = {
				key: 'talents',
				label: game.i18n.localize('GRIMWILD.Actor.Tabs.Talents'),
				active: true,
			};
		}

		// More tabs available to all actors.
		context.tabs.primary.effects = {
			key: 'effects',
			label: game.i18n.localize('GRIMWILD.Actor.Tabs.Effects'),
			active: false,
		};

		// Ensure we have a default tab.
		if (this.actor.type !== 'character') {
			context.tabs.primary.details.active = true;
		}
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle creating a new bond entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createBond(event, target) {
		event.preventDefault();
		const bonds = this.document.system.bonds;
		bonds.push({name: '', description: ''});
		await this.document.update({"system.bonds": bonds});
	}

	/**
	 * Handle deleting an existing bond entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteBond(event, target) {
		event.preventDefault();
		const dataset = target.dataset;
		if (dataset?.bond) {
			const bonds = this.document.system.bonds;
			bonds.splice(dataset.bond, 1);

			await this.document.update({"system.bonds": bonds});
		}
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

		console.log("foobar");

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