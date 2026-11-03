const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildBaseVueItemSheet extends foundry.applications.sheets.ItemSheetV2 {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "item"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		window: {
			controls: [
				{
					action: "showItemArtwork",
					icon: "fa-solid fa-image",
					label: "ITEM.ViewArt",
					ownership: "OWNER"
				}
			]
		},
		actions: {
			onEditImage: this._onEditImage,
			showItemArtwork: this._onShowArtwork,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			importFromCompendium: this._onImportFromCompendium
		},
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

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/

	/**
	 * Handle header control button clicks to display item artwork.
	 * @this {GrimwildBaseVueItemSheet}
	 * @param {PointerEvent} event
	 */
	static _onShowArtwork(event) {
		const { img, name, uuid } = this.document;
		new ImagePopout({ src: img, uuid, window: { title: name } }).render(true);
	}

	/**
	 * Handle header control button clicks to import compendium documents.
	 * @this {GrimwildBaseVueItemSheet}
	 * @param {PointerEvent} event
	 */
	static async _onImportFromCompendium(event) {
		await this.close();
		this.document.collection.importFromCompendium(this.document.compendium, this.document.id);
	}

	/**
	 * Handle changing a Document's image.
	 *
	 * @this GrimwildBaseVueItemSheet
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
	 * Renders an embedded document's sheet
	 *
	 * @this GrimwildBaseVueItemSheet
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
	 * @this GrimwildBaseVueItemSheet
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
	 * Handle creating a new ActiveEffect for the item using initial data defined in the HTML dataset
	 *
	 * @this GrimwildBaseVueItemSheet
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
				parent: this.item
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
		await aeCls.create(effectData, { parent: this.item });
	}

	/**
	 * Toggles an effect's disabled state.
	 *
	 * @this GrimwildBaseVueItemSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @private
	 */
	static async _toggleEffect(event, target) {
		const effect = this._getEffect(target);
		await effect.update({ disabled: !effect.disabled });
	}

	/**
	 * Fetches the row with the data for the rendered embedded document
	 *
	 * @param {HTMLElement} target  The element with the action
	 * @returns {ActiveEffect} The embedded ActiveEffect
	 */
	_getEffect(target) {
		const li = target.closest(".effect");
		return this.item.effects.get(li?.dataset?.effectId);
	}
}
