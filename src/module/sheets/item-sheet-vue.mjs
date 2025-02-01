import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueItemSheet } from "./_vue/_base-vue-item-sheet.mjs";
import { ItemSheetVue } from '../../vue/components.vue.es.mjs';

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildItemSheetVue extends VueRenderingMixin(GrimwildBaseVueItemSheet) {
	vueParts = {
		'item-sheet': {
			component: ItemSheetVue,
			template: `<item-sheet :context="context">Vue rendering for sheet failed.</item-sheet>`
		}
	}

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
			width: 478,
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
				},
			]
		},
		tag: "form",
		actions: {
			onEditImage: this._onEditImage,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			createResource: this._createResource,
			deleteResource: this._deleteResource,
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
			height: 300,
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
			'description',
		];

		for (let field of fields) {
			context.editors[`system.${field}`] = {

				enriched: await TextEditor.enrichHTML(this.item.system[field], enrichmentOptions),
				element: foundry.applications.elements.HTMLProseMirrorElement.create({
					...editorOptions,
					name: `system.${field}`,
					value: context.system?.[field] ?? '',
				}),
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
			primary: {},
		};

		// Tabs available to all items.
		context.tabs.primary.description = {
			key: 'description',
			label: game.i18n.localize('GRIMWILD.Item.Tabs.Description'),
			active: false,
		};

		// Tabs limited to NPCs.
		context.tabs.primary.attributes = {
			key: 'attributes',
			label: game.i18n.localize('GRIMWILD.Item.Tabs.Attributes'),
			active: true,
		};

		// More tabs available to all items.
		context.tabs.primary.effects = {
			key: 'effects',
			label: game.i18n.localize('GRIMWILD.Item.Tabs.Effects'),
			active: false,
		};

		// Ensure we have a default tab.
		if (this.item.type !== 'talent') {
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
	 * Handle creating a new resource entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createResource(event, target) {
		event.preventDefault();
		const { resourceType } = target.dataset;
		const resources = this.document.system.resources?.[resourceType];
		if (!resources) return;

		resources.push({});
		await this.document.update({
			[`system.resources.${resourceType}`]: resources,
		});
	}

	/**
	 * Handle deleting an existing resource entry.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _deleteResource(event, target) {
		event.preventDefault();
		const { resourceType, key } = target.dataset;
		if (resourceType && key) {
			const resources = this.document.system.resources?.[resourceType];
			if (!resources) return;

			resources.splice(Number(key), 1);

			await this.document.update({
				[`system.resources.${resourceType}`]: resources,
			});
		}
	}
}