const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;
const { ActorSheetV2 } = foundry.applications.sheets;

export class GrimwildBaseVueActorSheet extends ActorSheetV2 {
	constructor(options = {}) {
		super(options);
		this.#dragDrop = this.#createDragDropHandlers();
	}

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
		window: {
			// controls: [
			// 	{
			// 		action: "configurePrototypeToken",
			// 		icon: "fa-solid fa-user-circle",
			// 		label: "TOKEN.TitlePrototype",
			// 		ownership: "OWNER"
			// 	},
			// 	{
			// 		action: "showPortraitArtwork",
			// 		icon: "fa-solid fa-image",
			// 		label: "SIDEBAR.CharArt",
			// 		ownership: "OWNER"
			// 	},
			// 	{
			// 		action: "showTokenArtwork",
			// 		icon: "fa-solid fa-image",
			// 		label: "SIDEBAR.TokenArt",
			// 		ownership: "OWNER"
			// 	}
			// ]
		},
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
		},
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		form: {
			submitOnChange: true,
			submitOnClose: true
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
	 * Actions performed after any render of the Application.
	 * Post-render steps are not awaited by the render process.
	 * @param {ApplicationRenderContext} context      Prepared context data
	 * @param {RenderOptions} options                 Provided render options
	 * @protected
	 */
	_onRender(context, options) {
		this.#dragDrop.forEach((d) => d.bind(this.element));
		// You may want to add other special handling here
		// Foundry comes with a large number of utility classes, e.g. SearchFilter
		// That you may want to implement yourself.
	}

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

		for (const [key, item] of this.document.items.entries()) {
			if (typeof this.activeItems?.[item.id] === "undefined") {
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
	 * @this {ArchmageBaseItemSheetV2}
	 * @param {PointerEvent} event
	 */
	static _onShowArtwork(event) {
		const { img, name, uuid } = this.document;
		new ImagePopout(img, { title: name, uuid: uuid }).render(true);
	}

	/**
	 * Handle header control button clicks to import compendium documents.
	 * @this {ArchmageBaseItemSheetV2}
	 * @param {PointerEvent} event
	 */
	static async _onImportFromCompendium(event) {
		await this.close();
		this.document.collection.importFromCompendium(this.document.compendium, this.document.id);
	}

	/**
	 * Handle changing a Document's image.
	 *
	 * @this ArchmageBaseItemSheetV2
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
			top: this.position.top + 40,
			left: this.position.left + 10
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
	 * @this GrimwildActorSheet
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
	 * @this GrimwildActorSheet
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
	 * @this GrimwildActorSheet
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
	 * @this ArchmageBaseItemSheetV2
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @protected
	 */
	static async _viewEffect(event, target) {
		const effect = this._getEffect(target);
		effect.sheet.render(true);
	}

	/**
	 * Handles item deletion
	 *
	 * @this ArchmageBaseItemSheetV2
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
	 * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
	 *
	 * @this ArchmageBaseItemSheetV2
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

		// Finally, create the embedded document!
		await aeCls.create(effectData, { parent: this.actor });
		this.render(true);
	}

	/**
	 * Determines effect parent to pass to helper
	 *
	 * @this GrimwildActorSheet
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

	// /** *************
	//  *
	//  * Drag and Drop
	//  *
	//  ***************/

	// /**
	//  * Define whether a user is able to begin a dragstart workflow for a given drag selector
	//  * @param {string} selector       The candidate HTML selector for dragging
	//  * @returns {boolean}             Can the current user drag this selector?
	//  * @protected
	//  */
	// _canDragStart(selector) {
	// 	// game.user fetches the current user
	// 	return this.isEditable;
	// }

	// /**
	//  * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
	//  * @param {string} selector       The candidate HTML selector for the drop target
	//  * @returns {boolean}             Can the current user drop on this selector?
	//  * @protected
	//  */
	// _canDragDrop(selector) {
	// 	// game.user fetches the current user
	// 	return this.isEditable;
	// }

	// /**
	//  * Callback actions which occur at the beginning of a drag start workflow.
	//  * @param {DragEvent} event       The originating DragEvent
	//  * @protected
	//  */
	// _onDragStart(event) {
	// 	const docRow = event.currentTarget.closest("li");
	// 	if ("link" in event.target.dataset) return;

	// 	// Chained operation
	// 	let dragData = this._getEmbeddedDocument(docRow)?.toDragData();

	// 	if (!dragData) return;

	// 	// Set data transfer
	// 	event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
	// }

	// /**
	//  * Callback actions which occur when a dragged element is over a drop target.
	//  * @param {DragEvent} event       The originating DragEvent
	//  * @protected
	//  */
	// _onDragOver(event) {}

	// /**
	//  * Callback actions which occur when a dragged element is dropped on a target.
	//  * @param {DragEvent} event       The originating DragEvent
	//  * @returns {Promise|void} The promise for the dropped document, or void.
	//  * @protected
	//  */
	// async _onDrop(event) {
	// 	const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
	// 	const actor = this.actor;
	// 	const allowed = Hooks.call("dropActorSheetData", actor, this, data);
	// 	if (allowed === false) return;

	// 	// Handle different data types
	// 	switch (data.type) {
	// 		case "ActiveEffect":
	// 			return this._onDropActiveEffect(event, data);
	// 		case "Actor":
	// 			return this._onDropActor(event, data);
	// 		case "Item":
	// 			return this._onDropItem(event, data);
	// 		case "Folder":
	// 			return this._onDropFolder(event, data);
	// 	}
	// }

	// /* -------------------------------------------- */

	// /**
	//  * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
	//  *
	//  * @param {DragEvent} event
	//  * @param {ActiveEffect} effect
	//  * @returns {Promise|Array|void} Promise for the update, an array of effects, or void.
	//  */
	// async _onSortActiveEffect(event, effect) {
	// 	/** @type {HTMLElement} */
	// 	const dropTarget = event.target.closest("[data-effect-id]");
	// 	if (!dropTarget) return;
	// 	const target = this._getEmbeddedDocument(dropTarget);

	// 	// Don't sort on yourself
	// 	if (effect.uuid === target.uuid) return;

	// 	// Identify sibling items based on adjacent HTML elements
	// 	const siblings = [];
	// 	for (const el of dropTarget.parentElement.children) {
	// 		const siblingId = el.dataset.effectId;
	// 		const parentId = el.dataset.parentId;
	// 		if (
	// 			siblingId
	// 			&& parentId
	// 			&& (siblingId !== effect.id || parentId !== effect.parent.id)
	// 		) siblings.push(this._getEmbeddedDocument(el));
	// 	}

	// 	// Perform the sort
	// 	const sortUpdates = SortingHelpers.performIntegerSort(effect, {
	// 		target,
	// 		siblings
	// 	});

	// 	// Split the updates up by parent document
	// 	const directUpdates = [];

	// 	const grandchildUpdateData = sortUpdates.reduce((items, u) => {
	// 		const parentId = u.target.parent.id;
	// 		const update = { _id: u.target.id, ...u.update };
	// 		if (parentId === this.actor.id) {
	// 			directUpdates.push(update);
	// 			return items;
	// 		}
	// 		if (items[parentId]) items[parentId].push(update);
	// 		else items[parentId] = [update];
	// 		return items;
	// 	}, {});

	// 	// Effects-on-items updates
	// 	for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
	// 		await this.actor.items
	// 			.get(itemId)
	// 			.updateEmbeddedDocuments("ActiveEffect", updates);
	// 	}

	// 	// Update on the main actor
	// 	return this.actor.updateEmbeddedDocuments("ActiveEffect", directUpdates);
	// }

	// /**
	//  * Handle dropping of an Actor data onto another Actor sheet
	//  * @param {DragEvent} event            The concluding DragEvent which contains drop data
	//  * @param {object} data                The data transfer extracted from the event
	//  * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
	//  *                                     not permitted.
	//  * @protected
	//  */
	// async _onDropActor(event, data) {
	// 	if (!this.actor.isOwner) return false;
	// }

	// /* -------------------------------------------- */

	// /**
	//  * Handle dropping of an item reference or item data onto an Actor Sheet
	//  * @param {DragEvent} event            The concluding DragEvent which contains drop data
	//  * @param {object} data                The data transfer extracted from the event
	//  * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
	//  * @protected
	//  */
	// async _onDropItem(event, data) {
	// 	if (!this.actor.isOwner) return false;
	// 	const item = await Item.implementation.fromDropData(data);

	// 	// Handle item sorting within the same Actor
	// 	if (this.actor.uuid === item.parent?.uuid) return this._onSortItem(event, item);

	// 	// Create the owned item
	// 	return this._onDropItemCreate(item, event);
	// }

	// /**
	//  * Handle dropping of a Folder on an Actor Sheet.
	//  * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
	//  * @param {DragEvent} event     The concluding DragEvent which contains drop data
	//  * @param {object} data         The data transfer extracted from the event
	//  * @returns {Promise<Item[]>}
	//  * @protected
	//  */
	// async _onDropFolder(event, data) {
	// 	if (!this.actor.isOwner) return [];
	// 	const folder = await Folder.implementation.fromDropData(data);
	// 	if (folder.type !== "Item") return [];
	// 	const droppedItemData = await Promise.all(
	// 		folder.contents.map(async (item) => {
	// 			if (!(document instanceof Item)) item = await fromUuid(item.uuid);
	// 			return item;
	// 		})
	// 	);
	// 	return this._onDropItemCreate(droppedItemData, event);
	// }

	// /**
	//  * Handle the final creation of dropped Item data on the Actor.
	//  * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
	//  * @param {object[]|object} itemData      The item data requested for creation
	//  * @param {DragEvent} event               The concluding DragEvent which provided the drop data
	//  * @returns {Promise<Item[]>}
	//  * @private
	//  */
	// async _onDropItemCreate(itemData, event) {
	// 	itemData = itemData instanceof Array ? itemData : [itemData];
	// 	return this.actor.createEmbeddedDocuments("Item", itemData);
	// }

	// /**
	//  * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
	//  * @param {Event} event
	//  * @param {Item} item
	//  * @returns {Promise|void} The document update, or void.
	//  * @private
	//  */
	// _onSortItem(event, item) {
	// 	// Get the drag source and drop target
	// 	const items = this.actor.items;
	// 	const dropTarget = event.target.closest("[data-item-id]");
	// 	if (!dropTarget) return;
	// 	const target = items.get(dropTarget.dataset.itemId);

	// 	// Don't sort on yourself
	// 	if (item.id === target.id) return;

	// 	// Identify sibling items based on adjacent HTML elements
	// 	const siblings = [];
	// 	for (let el of dropTarget.parentElement.children) {
	// 		const siblingId = el.dataset.itemId;
	// 		if (siblingId && siblingId !== item.id) siblings.push(items.get(el.dataset.itemId));
	// 	}

	// 	// Perform the sort
	// 	const sortUpdates = SortingHelpers.performIntegerSort(item, {
	// 		target,
	// 		siblings
	// 	});
	// 	const updateData = sortUpdates.map((u) => {
	// 		const update = u.update;
	// 		update._id = u.target._id;
	// 		return update;
	// 	});

	// 	// Perform the update
	// 	return this.actor.updateEmbeddedDocuments("Item", updateData);
	// }

	// /* -------------------------------------------- */

	// /**
	//  * Returns an array of DragDrop instances
	//  * @type {DragDrop[]}
	//  */
	// get dragDrop() {
	// 	return this.#dragDrop;
	// }

	// This is marked as private because there's no real need
	// for subclasses or external hooks to mess with it directly
	#dragDrop;

	/**
	 * Create drag-and-drop workflow handlers for this Application
	 * @returns {DragDrop[]}     An array of DragDrop handlers
	 * @private
	 */
	#createDragDropHandlers() {
		return this.options.dragDrop.map((d) => {
			d.permissions = {
				dragstart: this._canDragStart.bind(this),
				drop: this._canDragDrop.bind(this)
			};
			d.callbacks = {
				dragstart: this._onDragStart.bind(this),
				dragover: this._onDragOver.bind(this),
				drop: this._onDrop.bind(this)
			};
			return new foundry.applications.ux.DragDrop.implementation(d);
		});
	}
}
