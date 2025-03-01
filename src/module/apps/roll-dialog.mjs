import { isMentalStat, isPhysicalStat } from "../helpers/config.mjs";

/**
 * @typedef {object} GrimwildRollDialogOptions
 * @property {GrimwildRollDialogRollData} rollData  The data to be injected into the roll dialog
 */

/**
 * @typedef {object} GrimwildRollDialogRollData
 * @property {string} stat                          Shorthand string for the stat being rolled
 * @property {number} diceDefault                   The number of dice associated with the stat being rolled
 * @property {number} spark                         The maximum spark available to be used
 * @property {boolean} isBloodied                   If the actor is bloodied
 * @property {boolean} isRattled                    If the actor is rattled
 * @property {boolean} isMarked                     If the stat being rolled is marked
 */

/**
 * @typedef {object} GrimwildRollDialogResponse
 * @property {number} dice                          The number of dice to roll
 * @property {number} thorns                        The number of thorns to roll
 * @property {number} sparkUsed                     The number of spark used on the roll
 * @property {object} assisters                     An object with the key of the assister's name and
 *                                                  the value of the number of dice they roll
 */

/**
 * A simple wrapper around a standard DialogV2's wait method to encapsulate the specific logic needed.
 * @extends {DialogV2}
 *
 * @example Open a new roll dialog for rolling BRAWN with marked and bloodied
 * ```js
 * const dialog = await GrimwildRollDialog.open({
 *  rollData: {
 *      stat: "bra",
 *      diceDefault: 2,
 *      isBloodied: true,
 *      isRattled: false,
 *      isMarked: true
 *  }
 * });
 * const totalDice = dialog.dice;
 * const totalThorns = dialog.thorns;
 * const sparkUsed = dialog.sparkUsed;
 * const assistMap = dialog.assisters;
 * ```
 */
export class GrimwildRollDialog extends foundry.applications.api.DialogV2 {
	static DEFAULT_OPTIONS = {
		...super.DEFAULT_OPTIONS,
		actions: {
			addAssist: this._addAssist
		},
		changeActions: {
			updateDice: this._updateDiceTotal,
			updateThorns: this._updateThornsTotal
		},
		inputActions: {
			updateDice: this._updateDiceTotal,
			updateThorns: this._updateThornsTotal
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
		const input = this.#onInput.bind(this);
		this.element.addEventListener("input", input);
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

	/**
	 * Input event actions in this.options.inputActions.
	 *
	 * Functionally similar to this.options.actions and fires callbacks
	 * specified in data-action-input on the element(s).
	 *
	 * @param {InputEvent} event Input event that triggered the call.
	 */
	async #onInput(event) {
		const target = event.target;
		const inputElement = target.closest("[data-action-input]");
		if (inputElement) {
			const { actionInput } = inputElement.dataset;
			if (actionInput) {
				this.options.inputActions?.[actionInput]?.call(
					this,
					event,
					inputElement
				);
			}
		}
	}

	/**
	 * Render function to set the initial dice and thorns on the dialog
	 *
	 * @param {any} event           The render event for the dialog
	 * @param {HTMLElement} html    The HTML element of the dialog
	 */
	static _render(event, html) {
		// set first thorns value
		const checkTotal = Array.from(html.querySelectorAll(".thornCheck")).reduce((sum, checkbox) => sum + (checkbox.checked ? 1 : 0), 0);
		const numTotal = Array.from(html.querySelectorAll(".thornInput")).reduce((sum, number) => sum + parseInt(number.value || 0, 10), 0);
		html.querySelector("#totalThorns").textContent = numTotal + checkTotal;
		html.querySelector("#totalThornsInput").value = numTotal + checkTotal;

		// set first dice value
		const assists = html.querySelectorAll(".assist-value");
		const assistTotal = Array.from(assists).reduce((sum, assist) => sum + parseInt(assist.value || 0, 10), 0);
		const stat = html.querySelector("#stat");
		const statTotal = parseInt(stat.value || 0, 10);
		html.querySelector("#totalDice").textContent = assistTotal + statTotal;
		html.querySelector("#totalDiceInput").value = assistTotal + statTotal;
	}

	/**
	 * Opens a new Grimwild Roll Dialog
	 *
	 * @param {Partial<ApplicationConfiguration & DialogV2Configuration & DialogV2WaitOptions & GrimwildRollDialogOptions>} options
	 * @param {GrimwildRollDialogRollData} [options.rollData]   The roll data to be injected into the dialog content
	 * @returns {Promise<null|GrimwildRollDialogResponse>}      Resolves to either null if dismissed or an object with data to be passed
	 *                                                          to a grimwild roll.
	 */
	static async open({ rollData, ...options }={}) {
		// add some preprocessed data
		rollData.hasSpark = rollData.spark > 0;
		rollData.sparkArray = Array.from({ length: rollData.spark }, (_, i) => i);
		// Ignore mark if there is associated harm
		rollData.markIgnored = rollData.isMarked
			&& ((rollData.isBloodied && isPhysicalStat(rollData.stat))
			|| (rollData.isRattled && isMentalStat(rollData.stat)));
		// Do not check marked if it is ignored
		rollData.isMarked = rollData.isMarked && !rollData.markIgnored;
		rollData.assistants = game.actors.filter((a) => a.type === "character" && a.name !== rollData.name).map((a) => a.name);

		options.content = await renderTemplate("systems/grimwild/templates/dialog/stat-roll.hbs", rollData);
		options.render = this._render;
		options.modal = true;
		options.window = { title: "Grimwild Roll" };
		options.rejectClose = false;
		options.buttons = [
			{
				label: game.i18n.localize("GRIMWILD.Dialog.Roll"),
				action: "roll",
				callback: (event, button, dialog) => {
					const assists = dialog.querySelectorAll(".assist-value");
					const assisters = {};
					Array.from(assists).forEach((assist) => {
						const nameInput = assist.closest(".grimwild-form-group").querySelector(".assist-name");
						const value = parseInt(assist.value || 0, 10);
						// Ignore empty assists
						if (value !== 0) {
							// Ensure there is a name to the assist
							const name = nameInput.value || "Assist";
							assisters[name] = value;
						}
					});
					const sparks = dialog.querySelectorAll(".sparkCheck");
					const sparkUsed = Array.from(sparks).reduce((sum, checkbox) => sum + (checkbox.checked ? 1 : 0), 0);
					return {
						dice: button.form.elements.totalDiceInput.value,
						thorns: button.form.elements.totalThornsInput.value,
						assisters,
						sparkUsed
					};
				}
			}
		];
		return super.wait(options);
	}

	static async _addAssist(event, target) {
		// create new row
		const row = document.createElement("div");
		row.classList.add("grimwild-form-group");

		// create new name input
		const textInput = document.createElement("input");
		textInput.classList.add("assist-name");
		textInput.type = "text";
		textInput.name = "textInput[]";
		textInput.placeholder = "Name";
		textInput.setAttribute("list", "assistants-list");

		// create new dice value input
		const numberInput = document.createElement("input");
		numberInput.classList.add("assist-value");
		numberInput.type = "number";
		numberInput.name = "numberInput[]";
		numberInput.value = 1;
		numberInput.setAttribute("data-action-input", "updateDice");
		numberInput.setAttribute("data-prev", 1);

		// add inputs to row
		row.appendChild(textInput);
		row.appendChild(numberInput);

		// add row to container
		const dialog = document.querySelector("#grimwild-roll-dialog");
		dialog.querySelector("#assistContainer").appendChild(row);

		// update totals
		const totalDisplay = dialog.querySelector("#totalDice");
		const totalValue = dialog.querySelector("#totalDiceInput");
		const currentValue = parseInt(totalDisplay.textContent || 0, 10);
		totalDisplay.textContent = currentValue + 1;
		totalValue.value = currentValue + 1;
	}

	static async _updateThornsTotal(event, target) {
		const dialog = document.querySelector("#grimwild-roll-dialog");
		const totalDisplay = dialog.querySelector("#totalThorns");
		const totalValue = dialog.querySelector("#totalThornsInput");
		handleUpdate(event, target, totalDisplay, totalValue);
	}

	static async _updateDiceTotal(event, target) {
		const dialog = document.querySelector("#grimwild-roll-dialog");
		const totalDisplay = dialog.querySelector("#totalDice");
		const totalValue = dialog.querySelector("#totalDiceInput");
		handleUpdate(event, target, totalDisplay, totalValue);
	}
}

const handleUpdate = (event, target, totalDisplay, totalValue) => {
	const currentValue = parseInt(totalDisplay.textContent || 0, 10);
	if (event.type === "change") {
		const newValue = target.checked ? currentValue + 1 : currentValue - 1;
		totalDisplay.textContent = newValue;
		totalValue.value = newValue;
	}
	else if (event.type === "input") {
		const previousValue = parseInt(target.dataset.prev || 0, 10);
		const newValue = parseInt(target.value || 0, 10);
		const diff = newValue - previousValue;
		const newTotal = currentValue + diff;
		target.dataset.prev = newValue;
		totalDisplay.textContent = newTotal;
		totalValue.value = newTotal;
	}
};
