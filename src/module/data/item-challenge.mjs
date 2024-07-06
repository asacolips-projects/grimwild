import GrimwildItemBase from "./base-item.mjs";

export default class GrimwildChallenge extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Challenge"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		return schema;
	}
}
