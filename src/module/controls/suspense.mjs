/**
 * Retrieve current suspense value.
 *
 * @returns {number}
 */
function getSuspense() {
	return game.settings.get("grimwild", "suspense");
}

/**
 * Sets current suspense value.
 * @param {number} value New suspense value.
 */
function setSuspense(value) {
	game.settings.set("grimwild", "suspense", value);
}

class SuspenseTracker {
	init() {
		console.log("Suspense: initialising");
		game.settings.register("grimwild", "suspenseVisible", {
			name: game.i18n.localize("GRIMWILD.Settings.suspenseVisible.name"),
			hint: game.i18n.localize("GRIMWILD.Settings.suspenseVisible.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (_) => this.render()
		});
		game.settings.register("grimwild", "suspense", {
			name: "Suspense",
			scope: "world",
			config: false,
			type: Number,
			default: 0,
			onChange: this.render
		});
	}

	render(value) {
		const isGM = game.user.isGM;
		const visibleToPlayers = game.settings.get("grimwild", "suspenseVisible");

		let susControl = document.getElementById("sus-control");

		if (!isGM && !visibleToPlayers) {
			if (susControl) susControl.innerHTML = "";
			return;
		}

		const buttonHtml = `
		<div id="sus-adjust">
			<button id="js-sus-up">+</button>
			<button id="js-sus-dn">-</button>
		</div>`;

		const label = game.i18n.localize("GRIMWILD.Resources.suspense");
		const susControlInnerHTML = `
		<div id="sus-control-inner">
			<div id="sus-display">
				<div id="sus-current">${getSuspense()}</div>
				<div id="sus-label">${label}</div>
			</div>
			${isGM ? buttonHtml : ""}
		</div>`;

		if (!susControl) {
			susControl = document.createElement("div");
			susControl.setAttribute("id", "sus-control");
			document.getElementById("ui-bottom").prepend(susControl);
		}
		susControl.innerHTML = susControlInnerHTML;

		if (isGM) {
			document.getElementById("js-sus-up").onclick = () => setSuspense(getSuspense() + 1);
			document.getElementById("js-sus-dn").onclick = () => {
				setSuspense(Math.max(getSuspense() - 1, 0));
			};
		}
		else if (!isNaN(value)) {
			// flash the display to notify players that the suspense value changed
			// a numerical value should only be passed in if triggered by the setting value changing
			// not by the initial render, or the visibilty toggle re-render
			const display = document.getElementById("sus-display");
			display.classList.add("flash");
			setTimeout(() => display.classList.remove("flash"), 50);
		}
	}
}

export const SUSPENSE_TRACKER = new SuspenseTracker();
