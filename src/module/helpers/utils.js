/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @returns {Promise}
 */
export async function preloadHandlebarsTemplates() {

	// Define template paths to load
	const templatePaths = [
		// Actor partials
		"systems/grimwild/templates/actor/parts/character-header.hbs",
		"systems/grimwild/templates/actor/parts/monster-header.hbs",
		"systems/grimwild/templates/chat/roll-action.hbs",
		"systems/grimwild/templates/chat/roll-crucible.hbs",
		"systems/grimwild/templates/chat/die-pool-action.hbs"
	];

	const paths = {};
	for (const path of templatePaths) {
		paths[path.replace(".hbs", ".html")] = path;
		paths[`grimwild.${path.split("/").pop()
			.replace(".hbs", "")}`] = path;
	}

	// Load the template parts
	return foundry.applications.handlebars.loadTemplates(paths);
}

class GrimwildHandlebarsHelpers {
	static grimwildDie(die) {
		const total = Number(die);

		if (total > 5) {
			return "perfect";
		}
		else if (total > 3) {
			return "messy";
		}

		return "grim";

	}

	static grimwildThorn(die) {
		const total = Number(die);

		if (total > 6) {
			return "cut";
		}

		return "skip";

	}
}

/**
 * Register helper functions for Handlebars.
 */
export function registerHandlebarsHelpers() {
	Handlebars.registerHelper({
		grimwildDie: GrimwildHandlebarsHelpers.grimwildDie,
		grimwildThorn: GrimwildHandlebarsHelpers.grimwildThorn
	});
}
