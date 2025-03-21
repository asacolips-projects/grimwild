// Import document classes.
import { GrimwildActor } from "./documents/actor.mjs";
import { GrimwildItem } from "./documents/item.mjs";
import { GrimwildChatMessage } from "./documents/chat-message.mjs";
// Import sheet classes.
import { GrimwildActorSheet } from "./sheets/actor-sheet.mjs";
import { GrimwildActorSheetVue } from "./sheets/actor-sheet-vue.mjs";
import { GrimwildActorMonsterSheetVue } from "./sheets/actor-monster-sheet-vue.mjs";
import { GrimwildItemSheet } from "./sheets/item-sheet.mjs";
import { GrimwildItemSheetVue } from "./sheets/item-sheet-vue.mjs";
// Import helper/utility classes and constants.
import { GRIMWILD } from "./helpers/config.mjs";
import * as dice from "./dice/_module.mjs";
import * as utils from "./helpers/utils.js";
// Import DataModel classes
import * as models from "./data/_module.mjs";

import { SUSPENSE_TRACKER } from "./controls/suspense.mjs";
import { GrimwildRollSheet } from "./sheets/roll-sheet.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.grimwild = {
	documents: {
		GrimwildActor,
		GrimwildItem,
		GrimwildChatMessage
	},
	applications: {
		GrimwildActorSheet,
		GrimwildActorSheetVue,
		GrimwildActorMonsterSheetVue,
		GrimwildItemSheet,
		GrimwildItemSheetVue
	},
	utils: {
		rollItemMacro
	},
	models,
	roll: dice.GrimwildRoll,
	diePools: dice.GrimwildDiePoolRoll
};

Hooks.once("init", function () {
	// Add custom constants for configuration.
	CONFIG.GRIMWILD = GRIMWILD;

	/**
	 * Set an initiative formula for the system
	 * @type {string}
	 */
	CONFIG.Combat.initiative = {
		formula: "d20",
		decimals: 0
	};

	// Dice.
	CONFIG.Dice.GrimwildRoll = dice.GrimwildRoll;
	CONFIG.Dice.rolls.push(dice.GrimwildRoll);
	CONFIG.Dice.GrimwildChatRoll = dice.GrimwildChatRoll;
	CONFIG.Dice.rolls.push(dice.GrimwildChatRoll);
	CONFIG.Dice.GrimwildDicePool = dice.GrimwildDiePoolRoll;
	CONFIG.Dice.rolls.push(dice.GrimwildDiePoolRoll);

	// Define custom Document and DataModel classes
	CONFIG.Actor.documentClass = GrimwildActor;

	// Note that you don't need to declare a DataModel
	// for the base actor/item classes - they are included
	// with the Character/Monster as part of super.defineSchema()
	CONFIG.Actor.dataModels = {
		character: models.GrimwildCharacter,
		monster: models.GrimwildMonster,
		linkedChallenge: models.GrimwildLinkedChallenge
	};
	CONFIG.Item.documentClass = GrimwildItem;
	CONFIG.Item.dataModels = {
		talent: models.GrimwildTalent,
		arcana: models.GrimwildArcana,
		challenge: models.GrimwildChallenge
	};

	// Override chat message class.
	CONFIG.ChatMessage.documentClass = grimwild.documents.GrimwildChatMessage;

	// Active Effects are never copied to the Actor,
	// but will still apply to the Actor from within the Item
	// if the transfer property on the Active Effect is true.
	CONFIG.ActiveEffect.legacyTransferral = false;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("grimwild", GrimwildActorMonsterSheetVue, {
		makeDefault: true,
		label: "Monster Sheet",
		types: ["monster", "linkedChallenge"]
	});
	Actors.registerSheet("grimwild", GrimwildActorSheetVue, {
		makeDefault: true,
		label: "GRIMWILD.SheetLabels.Actor",
		types: ["character"]
	});
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("grimwild", GrimwildItemSheet, {
		makeDefault: false,
		label: "GRIMWILD.SheetLabels.Item"
	});
	Items.registerSheet("grimwild", GrimwildItemSheetVue, {
		makeDefault: true,
		label: "Grimwild Vue Sheet",
		types: ["talent", "challenge"]
	});
	Messages.registerSheet("grimwild", GrimwildRollSheet, {
		makeDefault: true,
		label: "Grimwild Roll Sheet",
		types: ["grimwildroll"]
	});

	// Handlebars utilities.
	utils.preloadHandlebarsTemplates();
	utils.registerHandlebarsHelpers();

	// Custom settings.
	if (game.modules.get("dice-so-nice")) {
		game.settings.register("grimwild", "diceSoNiceOverride", {
			name: game.i18n.localize("GRIMWILD.Settings.diceSoNiceOverride.name"),
			hint: game.i18n.localize("GRIMWILD.Settings.diceSoNiceOverride.hint"),
			scope: "client",
			config: true,
			type: Boolean,
			default: false
		});
	}

	// Hook into Foundry's dice rolling system
	const originalCreate = Roll.create;

	// Override the Roll.create method
	Roll.create = function (formula) {
		// Custom logic to handle "1d" and "1d1t"
		const originalFormula = [...formula].join("");

		// @todo find a way to handle something like `/r pool 4d`
		// Handle raw dice pools.
		formula = formula.replace(/\b(\d*)p\b/gi, (match, x) => {
			// If "p" is alone, treat it as a d6 pool.
			const diceX = x || 1;
			return `{${diceX}d6}`;
		});
		if (originalFormula !== formula) {
			return new dice.GrimwildDiePoolRoll(formula);
		}

		// Handle raw d6 rolls.
		formula = formula.replace(/\b(\d*)d\b/gi, (match, x) => {
			// If "d" is alone, treat it as "d6"
			const diceX = x || 1; // Default to 1 if no number is provided
			return `{${diceX}d6kh, 0d8}`;
		});

		// Handle raw d6 + thorn rolls.
		formula = formula.replace(/\b(\d*)d(\d*)t\b/gi, (match, x, y) => {
			// Handle "1d1t" as "1d6 + 1d8"
			const diceX = x || 1; // Default to 1 if no number is provided
			const diceY = y || 1; // Default to 1 if no number is provided
			return `{${diceX}d6kh, ${diceY}d8}`;
		});

		// If we've made any changes, then this is a GrimwildRoll
		if (originalFormula !== formula) {
			return new dice.GrimwildRoll(formula);
		}

		// Call the original Roll.create for other cases
		return originalCreate.call(this, formula);
	};

	SUSPENSE_TRACKER.init();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper("toLowerCase", function (str) {
	return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
	Hooks.on("hotbarDrop", (bar, data, slot) => createDocMacro(data, slot));

	// Handle sockets.
	game.socket.on("system.grimwild", (options) => {
		// Limit to the active GM.
		if (game.users.activeGM.id === game.user.id) {
			// Handle the updateMessage type.
			if (options.type === "updateMessage") {
				if (options.flag && options.data) {
					const message = game.messages.get(options.message);
					if (message) {
						const [scope, key] = options.flag.split(".");
						message.setFlag(scope, key, options.data);
					}
				}
			}
		}
	});
});

Hooks.once("renderHotbar", function () {
	SUSPENSE_TRACKER.render();
	console.log("RENDERING");
});

Hooks.on("updateScene", (document, changed, options, userId) => {
	console.log("DOCUMENT", document);
	if (document.flags?.grimwild?.quickPools) {
		SUSPENSE_TRACKER.render();
	}
});

Hooks.on("renderSceneControls", (application, html, data) => {
	console.log("scene!");
	SUSPENSE_TRACKER.render();
});

/* -------------------------------------------- */
/*  Dice So Nice                                */
/* -------------------------------------------- */
Hooks.once("diceSoNiceReady", (dice3d) => {
	dice3d.addSystem({ id: "grimwild", name: game.i18n.localize("GRIMWILD.Settings.Grimwild") });
	dice3d.addDicePreset({
		system: "grimwild",
		type: "d6",
		labels: [
			"systems/grimwild/assets/dice/d6-1.png",
			"systems/grimwild/assets/dice/d6-2.png",
			"systems/grimwild/assets/dice/d6-3.png",
			"systems/grimwild/assets/dice/d6-4.png",
			"systems/grimwild/assets/dice/d6-5.png",
			"systems/grimwild/assets/dice/d6-6.png"
		]
	});
	dice3d.addDicePreset({
		system: "grimwild",
		type: "d8",
		labels: [
			"systems/grimwild/assets/dice/d8-1.png",
			"systems/grimwild/assets/dice/d8-2.png",
			"systems/grimwild/assets/dice/d8-3.png",
			"systems/grimwild/assets/dice/d8-4.png",
			"systems/grimwild/assets/dice/d8-5.png",
			"systems/grimwild/assets/dice/d8-6.png",
			"systems/grimwild/assets/dice/d8-7.png",
			"systems/grimwild/assets/dice/d8-8.png"
		]
	});
	// @todo Figure out a better solution for standard dice.
	dice3d.addColorset({
		name: "grimwild-dark",
		description: "Grimwild Dark",
		category: "Grimwild",
		foreground: "#999999",
		background: "#333333",
		font: "Arial",
		outline: "#000000",
		edge: "#444444",
		texture: "none",
		material: "glass"
	});
	// Preload grimwild dice.
	dice3d.DiceFactory.preloadPresets(true, null, { global: { system: "grimwild" } });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
	// First, determine if this is a valid owned item.
	if (data.type !== "Item") return;
	if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
		return ui.notifications.warn(
			"You can only create macro buttons for owned Items"
		);
	}
	// If it is, retrieve it based on the uuid.
	const item = await Item.fromDropData(data);

	// Create the macro command using the uuid.
	const command = `game.grimwild.rollItemMacro("${data.uuid}");`;
	let macro = game.macros.find(
		(m) => m.name === item.name && m.command === command
	);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: "script",
			img: item.img,
			command: command,
			flags: { "grimwild.itemMacro": true }
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
	// Reconstruct the drop data so that we can load the item.
	const dropData = {
		type: "Item",
		uuid: itemUuid
	};
	// Load the item from the uuid.
	Item.fromDropData(dropData).then((item) => {
		// Determine if the item loaded and if it's an owned item.
		if (!item || !item.parent) {
			const itemName = item?.name ?? itemUuid;
			return ui.notifications.warn(
				`Could not find item ${itemName}. You may need to delete and recreate this macro.`
			);
		}

		// Trigger the item roll
		item.roll();
	});
}
