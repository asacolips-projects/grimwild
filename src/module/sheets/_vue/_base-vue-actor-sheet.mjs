const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;
const { ActorSheetV2 } = foundry.applications.sheets;

export class GrimwildBaseVueActorSheet extends ActorSheetV2 {

	activeItems = {};

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 800,
			height: 600
		},
		window: {},
		actions: {
			onEditImage: this._onEditImage,
			viewDoc: this._viewDoc,
			createDoc: this._createDoc,
			deleteDoc: this._deleteDoc,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			toggleItem: this._toggleItem,
			importFromCompendium: this._onImportFromCompendium
		}
	};

	/* -------------------------------------------- */

	/** @inheritDoc */
	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		if (options.document.compendium) {
			const hasOption = options.window.controls.find((o) => o.action === "importFromCompendium");
			if (!hasOption) {
				options.window.controls.push({
					action: "importFromCompendium",
					icon: "fa-solid fa-download",
					label: "Import"
				});
			}
		}
		return options;
	}

	/**
	 * Drag-and-drop handler for the sheet, targeting the [data-drag] elements
	 * rendered by the Vue components. Core binds its own DragDrop with a
	 * hardcoded ".draggable" selector, so the getter is overridden here to keep
	 * the Vue markup draggable using core's drag handlers.
	 * @type {DragDrop}
	 * @protected
	 */
	get _dragDrop() {
		return this.#dragDrop ??= new foundry.applications.ux.DragDrop.implementation({
			dragSelector: "[data-drag]",
			permissions: {
				dragstart: this._canDragStart.bind(this),
				drop: this._canDragDrop.bind(this)
			},
			callbacks: {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this)
			}
		});
	}

	/** @type {DragDrop|null} */
	#dragDrop = null;

	/* -------------------------------------------- */

	/**
	 * Organize and classify Items for Actor sheets.
	 *
	 * @param {object} context The context object to mutate.
	 */
	_prepareItems(context) {
		context.items = this.document.items;
		context.itemTypes = this.document.itemTypes;

		for (const [type, items] of Object.entries(context.itemTypes)) {
			context.itemTypes[type] = items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		}

		// Seed the expansion state for current items and prune entries for
		// items that no longer exist.
		const currentIds = new Set(this.document.items.keys());
		for (const itemId of Object.keys(this.activeItems)) {
			if (!currentIds.has(itemId)) delete this.activeItems[itemId];
		}
		for (const item of this.document.items.values()) {
			if (typeof this.activeItems[item.id] === "undefined") {
				this.activeItems[item.id] = true;
			}
		}

		context.activeItems = this.activeItems;
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle header control button clicks to display actor portrait artwork.
	 * @this {GrimwildBaseVueActorSheet}
	 * @param {PointerEvent} event
	 */
	static _onShowArtwork(event) {
		const { img, name, uuid } = this.document;
		new ImagePopout({ src: img, uuid, window: { title: name } }).render(true);
	}

	/**
	 * Handle header control button clicks to import compendium documents.
	 * @this {GrimwildBaseVueActorSheet}
	 * @param {PointerEvent} event
	 */
	static async _onImportFromCompendium(event) {
		await this.close();
		this.document.collection.importFromCompendium(this.document.compendium, this.document.id);
	}

	/**
	 * Handle changing a Document's image.
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise}
	 * @protected
	 */
	static async _onEditImage(event, target) {
		if (!this.isEditable) return false;
		const attr = target.dataset.edit;
		const current = foundry.utils.getProperty(this.document, attr);
		const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
		const fp = new FilePicker({
			current,
			type: "image",
			redirectToRoot: img ? [img] : [],
			callback: (path) => {
				target.src = path;
				this.document.update({ [attr]: path });
			},
			position: {
				top: this.position.top + 40,
				left: this.position.left + 10
			}
		});
		return fp.browse();
	}

	/**
	 * Fetches the embedded document representing the containing HTML element
	 *
	 * @param {HTMLElement} target    The element subject to search
	 * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
	 */
	_getEmbeddedDocument(target) {
		const docRow = target.closest("li[data-document-class]");
		if (docRow.dataset.documentClass === "Item") {
			return this.actor.items.get(docRow.dataset.itemId);
		}
		else if (docRow.dataset.documentClass === "ActiveEffect") {
			const parent =
				docRow.dataset.parentId === this.actor.id
					? this.actor
					: this.actor.items.get(docRow?.dataset.parentId);
			return parent.effects.get(docRow?.dataset.effectId);
		} return console.warn("Could not find document class");
	}

	static async _toggleItem(event, target) {
		const { itemId } = target.dataset;
		if (itemId && typeof this.activeItems[itemId] !== "undefined") {
			this.activeItems[itemId] = !this.activeItems[itemId];
		}
		else {
			this.activeItems[itemId] = true;
		}
		this.render(true);
	}

	/**
	 * Renders an embedded document's sheet
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _viewDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		doc.sheet.render(true);
	}

	/**
	 * Handles item deletion
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _deleteDoc(event, target) {
		const doc = this._getEmbeddedDocument(target);
		await doc.delete();
	}

	/**
	 * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createDoc(event, target) {
		// Retrieve the configured document class for Item or ActiveEffect
		const docCls = getDocumentClass(target.dataset.documentClass);
		// Prepare the document creation data by initializing it a default name.
		const docData = {
			name: docCls.defaultName({
				// defaultName handles an undefined type gracefully
				type: target.dataset.type,
				parent: this.actor
			})
		};
		// Loop through the dataset and add it to our docData
		for (const [dataKey, value] of Object.entries(target.dataset)) {
			// These data attributes are reserved for the action handling
			if (["action", "documentClass"].includes(dataKey)) continue;
			// Nested properties require dot notation in the HTML, e.g. anything with `system`
			// An example exists in spells.hbs, with `data-system.spell-level`
			// which turns into the dataKey 'system.spellLevel'
			foundry.utils.setProperty(docData, dataKey, value);
		}

		// Finally, create the embedded document!
		await docCls.create(docData, { parent: this.actor });
	}

	/**
	 * Renders an embedded document's sheet
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _viewEffect(event, target) {
		const effect = this._getEffect(target);
		effect.sheet.render(true);
	}

	/**
	 * Handles effect deletion
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _deleteEffect(event, target) {
		if (!this.isEditable) return;
		const effect = this._getEffect(target);
		await effect.delete();
	}

	/**
	 * Handle creating a new ActiveEffect for the actor using initial data defined in the HTML dataset
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _createEffect(event, target) {
		if (!this.isEditable) return;
		// Retrieve the configured document class for ActiveEffect
		const aeCls = getDocumentClass("ActiveEffect");
		// Prepare the document creation data by initializing it a default name.
		// As of v12, you can define custom Active Effect subtypes just like Item subtypes if you want
		const effectData = {
			img: this.document.img || "icons/svg/aura.svg",
			origin: this.document.uuid,
			name: aeCls.defaultName({
				// defaultName handles an undefined type gracefully
				type: target.dataset.type,
				parent: this.actor
			})
		};
		// Loop through the dataset and add it to our effectData
		for (const [dataKey, value] of Object.entries(target.dataset)) {
			// These data attributes are reserved for the action handling
			if (["action", "documentClass"].includes(dataKey)) continue;
			// Nested properties require dot notation in the HTML, e.g. anything with `system`
			// An example exists in spells.hbs, with `data-system.spell-level`
			// which turns into the dataKey 'system.spellLevel'
			foundry.utils.setProperty(effectData, dataKey, value);
		}

		// Finally, create the embedded document! The resulting document update
		// triggers a re-render of the sheet.
		await aeCls.create(effectData, { parent: this.actor });
	}

	/**
	 * Determines effect parent to pass to helper
	 *
	 * @this GrimwildBaseVueActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _toggleEffect(event, target) {
		const effect = this._getEmbeddedDocument(target);
		await effect.update({ disabled: !effect.disabled });
	}

	/**
	 * Fetches the row with the data for the rendered embedded document
	 *
	 * @param {HTMLElement} target  The element with the action
	 * @returns {HTMLLIElement} The document's row
	 */
	_getEffect(target) {
		const li = target.closest(".effect");
		return this.actor.effects.get(li?.dataset?.effectId);
	}
}
