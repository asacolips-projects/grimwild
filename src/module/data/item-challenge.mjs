import GrimwildItemBase from "./base-item.mjs";

export default class GrimwildChallenge extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Challenge"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();
		const requiredInteger = { required: true, nullable: false, integer: true };

		schema.roll = new fields.SchemaField({
			diceNum: new fields.NumberField({
				...requiredInteger,
				initial: 1,
				min: 0
			}),
			diceSize: new fields.StringField({ initial: "d6" })
		});

		schema.formula = new fields.StringField({ blank: true });

		return schema;
	}

	prepareDerivedData() {
		// Build the formula dynamically using string interpolation
		const roll = this.roll;

		this.formula = `{${roll.diceNum}${roll.diceSize}, 0d8}`;
	}

}
