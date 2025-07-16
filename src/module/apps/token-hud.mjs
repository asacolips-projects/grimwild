
export class GrimwildTokenHud extends foundry.applications.hud.TokenHUD {
	static DEFAULT_OPTIONS = {
		...super.DEFAULT_OPTIONS,
		actions: {
			spotlight: GrimwildTokenHud.#onSpotlight
		}
	};

	static PARTS = {
		hud: {
			root: true,
			template: "systems/grimwild/templates/hud/token-hud.hbs"
		}
	};

	static #onSpotlight(event, target) {
		const combatant = game.combats.viewed?.turns.find((c) => c.tokenId === this.object.id);
		game.combats.viewed?.spotlightCombatant(combatant?.id);
		this.close();
	}
}
