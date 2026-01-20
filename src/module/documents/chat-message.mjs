export class GrimwildChatMessage extends ChatMessage {
	/** @inheritDoc */
	async renderHTML(...args) {
		const html = await super.renderHTML();
		this._enrichChatCard(html);

		return html;
	}

	/**
	 * Augment the chat card markup for additional styling.
	 * @param {HTMLElement} html  The chat card markup.
	 * @protected
	 */
	_enrichChatCard(html) {
		// Header matter
		const { scene: sceneId, token: tokenId, actor: actorId } = this.speaker;
		const actor = game.scenes.get(sceneId)?.tokens.get(tokenId)?.actor ?? game.actors.get(actorId);

		let img;
		let nameText;
		if (this.isContentVisible) {
			img = actor?.img ?? this.author.avatar;
			nameText = this.alias;
		}
		else {
			img = this.author.avatar;
			nameText = this.author.name;
		}

		const avatar = document.createElement("a");
		avatar.classList.add("avatar");
		if (actor) avatar.dataset.uuid = actor.uuid;
		avatar.innerHTML = `<img src="${img}" alt="${nameText}">`;

		const name = document.createElement("span");
		name.classList.add("name-stacked");
		name.innerHTML = `<span class="title">${nameText}</span>`;

		const subtitle = document.createElement("span");
		subtitle.classList.add("subtitle");
		if (this.whisper.length) subtitle.innerText = html.querySelector(".whisper-to")?.innerText ?? "";
		if ((nameText !== this.author?.name) && !subtitle.innerText.length) subtitle.innerText = this.author?.name ?? "";

		name.appendChild(subtitle);

		const sender = html.querySelector(".message-sender");
		if (img !== "icons/svg/mystery-man.svg") {
			sender?.replaceChildren(avatar, name);
		}
		else {
			sender?.replaceChildren(name);
		}
		html.querySelector(".whisper-to")?.remove();

		const metadata = html.querySelector(".message-metadata");
		let footer = html.querySelector(".message-footer");
		if (!footer) {
			footer = document.createElement("footer");
			footer.classList.add("message-footer");
		}

		const messageVisibility = document.createElement("span");
		messageVisibility.classList.add("message-visibility");
		if (this.whisper.length > 0) {
			messageVisibility.innerHTML = this.blind
				? `<i class="fas fa-eye-slash"></i> ${game.i18n.localize("CHAT.RollBlind")}`
				: `<i class="fas fa-eye-slash"></i> ${game.i18n.localize("CHAT.RollPrivate")}`;
		}

		footer.appendChild(messageVisibility);
		footer.appendChild(metadata);
		html.appendChild(footer);

		// Handle event listeners.
		const click = this.#onClick.bind(this);
		const sparkTakenArray = this.getFlag("grimwild", "sparkTaken") ?? [];
		// const damageTakenArray = this.getFlag("grimwild", "damageTaken") ?? [];
		const sparkTaken = sparkTakenArray.includes(game.user.id);
		// const damageTaken = damageTakenArray.includes(game.user.id);
		html.querySelectorAll("[data-action]")?.forEach((element) => {
			const { action } = element.dataset;
			if (action === "updateSpark") {
				if (sparkTaken) {
					element.setAttribute("disabled", true);
					return;
				}
			}
			else if (["applyMark", "applyHarm"].includes(action)) {
				// if (damageTaken) {
					// element.setAttribute("disabled", true);
					// return;
				// }
			}
			element.addEventListener("click", click);
		});
	}

	/**
	 * Simulate this.options.actions from ApplicationV2.
	 *
	 * @returns {object} actions
	 */
	get actions() {
		return {
			updateSpark: this._updateSpark,
			applyMark: this._applyHarm,
			applyHarm: this._applyHarm
		};
	}

	/**
	 * Click event actions in get actions().
	 *
	 * @param {PointerEvent} event Click event that triggered the call.
	 */
	#onClick(event) {
		const target = event.target;
		const clickElement = target.closest("[data-action]");
		if (clickElement) {
			const { action } = clickElement.dataset;
			if (action) {
				this.actions?.[action]?.call(
					this,
					event,
					clickElement
				);
			}
		}
	}

	/**
	 * Handle updating spark on actors.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 */
	async _updateSpark(event, target) {
		const actor = game.user.character ?? canvas.tokens.controlled?.[0]?.actor;
		if (!actor) {
			ui.notifications.warn("No active characters on this user to add spark to.");
			return;
		}

		const spark = actor.system.spark;
		let needsUpdate = false;
		if (!spark.steps[0]) {
			spark.steps[0] = true;
			needsUpdate = true;
		}
		else if (!spark.steps[1]) {
			spark.steps[1] = true;
			needsUpdate = true;
		}

		if (needsUpdate) {
			actor.update({ "system.spark": spark });
			const sparkTakenArray = this.getFlag("grimwild", "sparkTaken") ?? [];
			if (!sparkTakenArray.includes(game.user.id)) {
				sparkTakenArray.push(game.user.id);
			}
			// If this is the GM, update the message directly.
			if (game.user.isGM) {
				this.setFlag("grimwild", "sparkTaken", sparkTakenArray);
			}
			// Otherwise, emit a socket so that the active GM can update it.
			else {
				game.socket.emit("system.grimwild", {
					type: "updateMessage",
					flag: "grimwild.sparkTaken",
					message: this.id,
					data: sparkTakenArray
				});
			}
		}
		else {
			ui.notifications.warn(`${actor.name} already has maximum spark. Use it more often!`);
		}
	}

	/**
	 * Handle updating marks on actors.
	 *
	 * @param {PointerEvent} event The originating click event
	 * @param {HTMLElement} target The capturing HTML element which defined a [data-action]
	 */
	async _applyHarm(event, target) {
		const actor = game.user.character ?? canvas.tokens.controlled?.[0]?.actor;
		if (!actor) {
			ui.notifications.warn("No active characters on this user to add a mark to.");
			return;
		}

		// Retrieve the stat to check.
		const { stat, harm } = target?.dataset ?? {};
		const update = {};
		let harmUpdate = {};
		// Handle marks.
		if (stat) {
			if (["bra", "agi", "wit", "pre"].includes(stat)) {
				const isMarked = actor.system.stats[stat].marked;
				if (!isMarked) {
					update[`system.stats.${stat}.marked`] = true;
				}
				else if (["bra", "agi"].includes(stat)) {
					harmUpdate = this.calculateHarm(actor, "bloodied");
				}
				else {
					harmUpdate = this.calculateHarm(actor, "rattled");
				}
			}
		}

		// Handle harm.
		if (harm) {
			if (["bloodied", "rattled"].includes(harm)) {
				harmUpdate = this.calculateHarm(actor, harm);
			}
		}

		// Apply updates.
		actor.update({
			...update,
			...harmUpdate
		});
		const damageTakenArray = this.getFlag("grimwild", "damageTaken") ?? [];
		if (!damageTakenArray.includes(game.user.id)) {
			damageTakenArray.push(game.user.id);
		}
		// If this is the GM, update the message directly.
		if (game.user.isGM) {
			this.setFlag("grimwild", "damageTaken", damageTakenArray);
		}
		// Otherwise, emit a socket so that the active GM can update it.
		else {
			game.socket.emit("system.grimwild", {
				type: "updateMessage",
				flag: "grimwild.damageTaken",
				message: this.id,
				data: damageTakenArray
			});
		}
	}

	/**
	 * Helper function to calculate harm
	 *
	 * @param {GrimwildActor} actor Actor to check the data for.
	 * @param {string} harm 'bloodied' or 'rattled'
	 * @returns {object} Foundry update object for the actor
	 */
	calculateHarm(actor, harm) {
		const harmPools = game.settings.get("grimwild", "enableHarmPools");
		const maxHarm = game.settings.get("grimwild", `max${harm === "bloodied" ? "Bloodied" : "Rattled"}`) ?? 1;
		const update = {};
		if (!actor.system[harm === "bloodied" ? "isBloodied" : "isRattled"]) {
			update[`system.${harm}.marked`] = true;
			if (harmPools) {
				const newHarmPool = Math.min(actor.system[harm].pool.diceNum + 1, maxHarm);
				update[`system.${harm}.pool.diceNum`] = newHarmPool;
			}
		}
		else if (!harmPools || actor.system[harm].pool.diceNum >= maxHarm) {
			update["system.dropped"] = true;
		}
		else {
			update[`system.${harm}.pool.diceNum`] = actor.system[harm].pool.diceNum + 1;
		}

		return update;
	}
}
