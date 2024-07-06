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
		"systems/grimwild/templates/actor/parts/npc-header.hbs",
	];

	const paths = {};
	for (const path of templatePaths) {
		paths[path.replace(".hbs", ".html")] = path;
		paths[`grimwild.${path.split("/").pop()
			.replace(".hbs", "")}`] = path;
	}

	// Load the template parts
	return loadTemplates(paths);
}