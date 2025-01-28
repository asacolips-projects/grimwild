import GrimwildItemBase from "./base-item.mjs";
import { DicePoolField } from "../helpers/schema.mjs";

export default class GrimwildChallenge extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Challenge"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		schema.roll = new DicePoolField();

		schema.formula = new fields.StringField({ blank: true });

		return schema;
	}

	prepareDerivedData() {
		// Build the formula dynamically using string interpolation
		const roll = this.roll;

		this.formula = `{${roll.diceNum}d6}`;
	}

}
