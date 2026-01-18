const { api, sheets } = foundry.applications;

export class GrimwildRollTableCrucibleSheet extends api.HandlebarsApplicationMixin(
	sheets.RollTableSheet
) {
	/**
	 * The operational mode in which a newly created instance of this sheet starts
	 * @type {"edit"|"view"}
	 */
	static #DEFAULT_MODE = "view";

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["roll-table-sheet", "grimwild-crucible-sheet"],
		window: {
			contentClasses: ["standard-form"],
			icon: "fa-solid fa-table-list",
			resizable: true
		},
		position: {width: 720},
		form: {
			closeOnSubmit: false
		},
		actions: {
			drawResult: GrimwildRollTableCrucibleSheet.#onDrawResult,
		}
	};

	/** @override */
	static PARTS = {
		sheet: {
			template: "systems/grimwild/templates/roll-table/crucible-view.hbs",
			templates: ["templates/sheets/roll-table/result-details.hbs"],
			scrollable: ["table[data-results] tbody"],
			root: true
		},
		header: {template: "templates/sheets/roll-table/edit/header.hbs"},
		tabs: {template: "templates/generic/tab-navigation.hbs"},
		results: {
			template: "systems/grimwild/templates/roll-table/edit/crucible-results.hbs",
			templates: ["templates/sheets/roll-table/result-details.hbs"],
			scrollable: ["table[data-results] tbody"]
		},
		summary: {template: "templates/sheets/roll-table/edit/summary.hbs"},
		footer: {template: "templates/generic/form-footer.hbs"}
	};

	static MODE_PARTS = {
		edit: ["header", "results", "footer"],
		view: ["sheet", "footer"]
	}

	grid = {
		1: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
		2: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
		3: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
		4: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
		5: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
		6: {1: '', 2: '', 3: '', 4: '', 5: '', 6: ''},
	}

	/** @inheritDoc */
	_prepareSubmitData(event, form, formData, updateData) {
		const submitData = super._prepareSubmitData(event, form, formData, updateData);
		for (const result of submitData.results ?? []) {
			sheets.TableResultConfig.prepareResultUpdateData(result);
		}
		return submitData;
	}

	/** @inheritDoc */
	async submit(options) {
		if ( !this.isEditMode ) return;
		return super.submit(options);
	}

	/** @inheritDoc */
	_configureRenderOptions(options) {
		if ( !this.isEditable ) this.mode = "view";
		else if ( options.isFirstRender && !this.document.results.size ) this.mode = "edit";
		return super._configureRenderOptions(options);
	}

	/* -------------------------------------------- */

	/** @override */
	_configureRenderParts(options) {
		const parts = super._configureRenderParts(options);
		const allowedParts = this.constructor.MODE_PARTS[this.mode];
		for ( const partId in parts ) {
			if ( !allowedParts.includes(partId) ) delete parts[partId];
		}
		return parts;
	}

	_prepareTabs(group) {
		return {tabs: {}};
	}

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		const {description, results, isOwner} = context.document;
		switch ( partId ) {
			case "results":
				context.tab = context.tabs.results;
				context.resultFields = foundry.documents.TableResult.schema.fields;
				await this._prepareCrucibleGrid(context);
				break;
			// case "summary":
			//   context.tab = context.tabs.summary;
			//   context.descriptionHTML = await TextEditor.implementation.enrichHTML(description, {secrets: isOwner});
			//   context.formulaPlaceholder = `1d${results.size || 20}`;
			//   break;
			case "sheet": // Lone view-mode part
				context.descriptionHTML = await TextEditor.implementation.enrichHTML(description, {secrets: isOwner});
				context.formula = context.source.formula || `1d${results.size || 20}`;
				await this._prepareCrucibleGrid(context);
				break;
			case "footer":
				context.buttons = [
					{
						type: "button",
						action: "resetResults",
						icon: "fa-solid fa-arrow-rotate-left",
						label: "TABLE.ACTIONS.ResetResults"
					},
					{
						type: "button",
						action: "drawResult",
						icon: "fa-solid fa-dice-d20",
						label: "TABLE.ACTIONS.DrawResult"
					}
				];
				if ( this.isEditMode ) {
					context.buttons.unshift({
						type: "submit",
						icon: "fa-solid fa-floppy-disk",
						label: "TABLE.ACTIONS.Submit"
					});
				}
		}
		return context;
	}

	/**
	 * Prepare sheet data for a single TableResult.
	 * @param {TableResult} result    The result from which to prepare
	 * @returns {Promise<object>}     The sheet data for this result
	 * @protected
	 */
	async _prepareResult(result) {

		// Show a single numeric value in view mode for zero-interval ranges
		const range = this.isEditMode
			? [...result.range]
			: result.range[0] === result.range[1] ? result.range[0] : `${result.range[0]}–${result.range[1]}`;

		return {
			id: result.id,
			img: result.icon,
			name: result.name,
			fields: result.schema.fields,
			description: await TextEditor.implementation.enrichHTML(result.description, {relativeTo: result,
				secrets: result.isOwner}),
			documentLink: result.documentToAnchor()?.outerHTML,
			weight: result.weight,
			range,
			drawn: result.drawn
		};
	}

	async _prepareCrucibleGrid(context) {
		const { results } = context.document;
		const getSortedResults = () => results.contents.sort(this._sortResults.bind(this)).slice(0,36);
		context.results = await Promise.all(getSortedResults().map(this._prepareResult.bind(this)));
		context.grid = this.document.getCrucibleTable();
	}

	/** @inheritDoc */
	async _onRender(context, options) {
		await super._onRender(context, options);

		// Drag and Drop
		new foundry.applications.ux.DragDrop.implementation({
			dropSelector: ".window-content",
			permissions: {
				dragstart: () => false,
				drop: () => this.isEditMode
			},
			callbacks: {
				drop: this._onDrop.bind(this)
			}
		}).bind(this.element);

		// Allow draws with replacement by observers even if the Table is not editable
		if ( !options.parts.includes("footer") ) return;
		const table = context.document;
		const drawButton = this.element.querySelector("button[data-action=drawResult]");
		if ( table.replacement && table.testUserPermission(game.user, "OBSERVER") ) {
			drawButton.disabled = false;
		}
		// Disallow draws without replacement from compendium Tables
		else if ( !table.replacement && table.pack ) {
			drawButton.disabled = true;
		}
	}

	static async #onDrawResult(_event, button) {
		if ( this.form ) await this.submit({operation: {render: false}});
		button.disabled = true;

		await this.document.rollCrucible({toMessage: true});

		// Reenable the button if drawing with replacement since the draw won't trigger a sheet re-render
		const table = this.document;
		if ( table.replacement ) button.disabled = false;
	}
}