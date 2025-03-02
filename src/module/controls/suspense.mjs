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

/**
 *
 */
function getScenePools() {
	const scene = getScene();
	if (!scene) return "";

	const pools = scene.getFlag("grimwild", "quickPools") ?? [];
	const editable = game.user.isGM ? "contentEditable=\"plaintext-only\"" : "";
	const poolHtml = `
	<div class="quick-pool-inner">
		<div class="quick-pool-list">
			${pools.filter((pool) => game.user.isGM || pool.visible).map((pool, index) => `
				<div class="quick-pool flex-row">
					<div class="flex-col">
						<div class="quick-pool-current">
							<span class="js-quick-pool-text" ${editable} data-pool="${index}" data-field="diceNum">${pool.diceNum}</span>d
						</div>
						<div class="quick-pool-label">
							<span class="js-quick-pool-text" ${editable} data-pool="${index}" data-field="label">${pool.label}</span>
						</div>
					</div>
					${game.user.isGM
		? `<div class="flex-col flex-center">
						<button class="button-icon js-quick-pool-roll" type="button" data-visible="${pool.visible}" data-roll-data="${pool.diceNum}" data-pool="${index}"><i class="fas fa-dice-d6"></i></button>
						<button class="button-icon js-quick-pool-display" type="button" data-pool="${index}"><i class="fas fa-eye${pool.visible ? "" : "-slash dim"}"></i></button>
						<button class="button-icon js-quick-pool-delete" data-pool="${index}" type="button"><i class="fas fa-trash"></i></button>
					</div>` : ""
}
				</div>
			`)
		.join("")}
		</div>
		${game.user.isGM
		? `<div class="quick-pool-adjust">
			<button class="hover-highlight js-quick-pool-add">+ Pool</button>
		</div>` : ""}
	</div>
	`;
	return poolHtml;
}

/**
 *
 */
function addQuickPool() {
	const scene = getScene();
	if (!scene) return "";

	const visibleDefault = game.settings.get("grimwild", "quickPoolsVisibleDefault");
	const pools = scene.getFlag("grimwild", "quickPools") ?? [];
	pools.push({ diceNum: 4, label: "Label", visible: visibleDefault });
	scene.setFlag("grimwild", "quickPools", pools);
	ui.hotbar.render();
}

/**
 *
 */
function getScene() {
	return canvas?.scene ?? game.scenes.active;
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
		game.settings.register("grimwild", "quickPoolsVisible", {
			name: game.i18n.localize("GRIMWILD.Settings.quickPoolsVisible.name"),
			hint: game.i18n.localize("GRIMWILD.Settings.quickPoolsVisible.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: (_) => this.render()
		});
		game.settings.register("grimwild", "quickPoolsVisibleDefault", {
			name: game.i18n.localize("GRIMWILD.Settings.quickPoolsVisibleDefault.name"),
			hint: game.i18n.localize("GRIMWILD.Settings.quickPoolsVisibleDefault.hint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
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
		const susVisibleToPlayers = game.settings.get("grimwild", "suspenseVisible");
		const quickPoolsVisibleToPlayers = game.settings.get("grimwild", "quickPoolsVisible");

		console.log("CLASS RENDER", getScene());

		let susControl = document.getElementById("sus-control");

		if (!isGM && !susVisibleToPlayers && !quickPoolsVisibleToPlayers) {
			if (susControl) susControl.innerHTML = "";
			return;
		}

		const buttonHtml = `
		<div id="sus-adjust">
			<button class="hover-highlight" id="js-sus-up">+</button>
			<button class="hover-highlight" id="js-sus-dn">-</button>
		</div>`;

		const label = game.i18n.localize("GRIMWILD.Resources.suspense");
		const susControlInnerHTML = isGM || susVisibleToPlayers ? `
		<div id="sus-control-inner">
			<div id="sus-display" class="flex-col">
				<div id="sus-current">${getSuspense()}</div>
				<div id="sus-label">${label}</div>
			</div>
			${isGM ? buttonHtml : ""}
		</div>` : "";

		if (!susControl) {
			susControl = document.createElement("div");
			susControl.setAttribute("id", "sus-control");
			document.getElementById("ui-bottom").prepend(susControl);
		}

		const quickPoolHtml = isGM || quickPoolsVisibleToPlayers ? getScenePools() : "";
		susControl.innerHTML = `${susControlInnerHTML}${quickPoolHtml}`;

		if (isGM) {
			document.getElementById("js-sus-up").onclick = () => setSuspense(getSuspense() + 1);
			document.getElementById("js-sus-dn").onclick = () => {
				setSuspense(Math.max(getSuspense() - 1, 0));
			};
			document.querySelector(".js-quick-pool-add").onclick = () => addQuickPool();

			document.querySelectorAll(".js-quick-pool-delete").forEach((element) => element.addEventListener("click", (event) => {
				const { pool } = event.currentTarget.dataset;
				const scene = getScene();
				console.log("POOL", pool);
				if (!scene) return;
				const quickPools = scene.getFlag("grimwild", "quickPools");
				quickPools.splice(pool, 1);
				scene.setFlag("grimwild", "quickPools", quickPools);
			}));

			document.querySelectorAll(".js-quick-pool-display").forEach((element) => element.addEventListener("click", (event) => {
				const { pool } = event.currentTarget.dataset;
				const scene = getScene();
				console.log("POOL", pool);
				if (!scene) return;
				const quickPools = scene.getFlag("grimwild", "quickPools");
				quickPools[pool].visible = !quickPools[pool].visible;
				scene.setFlag("grimwild", "quickPools", quickPools);
			}));

			document.querySelectorAll(".js-quick-pool-text").forEach((element) => element.addEventListener("focusout", (event) => {
				const { pool, field } = event.currentTarget.dataset;
				const scene = getScene();
				if (!scene) return;
				const quickPools = scene.getFlag("grimwild", "quickPools");
				let value = event.currentTarget.innerText;
				// If value isn't a number on the pool field, exit early.
				if (field === "diceNum" && !Number.isNumeric(value)) {
					this.render();
					return;
				}
				quickPools[pool][field] = value;
				scene.setFlag("grimwild", "quickPools", quickPools);
			}));

			document.querySelectorAll(".js-quick-pool-roll").forEach((element) => element.addEventListener("click", async (event) => {
				console.log(event);
				let { visible, rollData, pool } = event.currentTarget.dataset;
				rollData = Number.isNumeric(rollData) ? Number(rollData) : 0;
				const scene = getScene();
				console.log("rollData", rollData, event.currentTarget);
				if (!scene || !rollData) return;
				const quickPools = scene.getFlag("grimwild", "quickPools");

				if (rollData) {
					const roll = new grimwild.diePools(`{${rollData}d6}`, {});
					const result = await roll.evaluate();
					const dice = result.dice[0].results;
					const dropped = dice.filter((die) => die.result < 4);

					const speaker = ChatMessage.getSpeaker();
					const rollMode = visible === "true" ? game.settings.get("core", "rollMode") : CONST.DICE_ROLL_MODES.PRIVATE;
					const label = `[pool] ${event.target.closest(".quick-pool").querySelector(".quick-pool-label .js-quick-pool-text").innerText}`;
					// Send to chat.
					const msg = await roll.toMessage({
						speaker: speaker,
						rollMode: rollMode,
						flavor: label
					}, { rollMode: rollMode });

					if (game.dice3d && msg?.id) {
						await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
					}

					rollData -= dropped.length;

					quickPools[pool].diceNum = rollData;
					scene.setFlag("grimwild", "quickPools", quickPools);
				}
			}));
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
