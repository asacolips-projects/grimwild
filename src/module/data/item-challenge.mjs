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

		// Obsolete
		schema.roll = new DicePoolField();

		// New
		schema.pool = new DicePoolField();
		schema.suspense = new fields.SchemaField({
			steps: new fields.ArrayField(new fields.BooleanField())
		});

		schema.traits = new fields.ArrayField(new fields.StringField());
		schema.moves = new fields.ArrayField(new fields.StringField());

		schema.failure = new fields.ArrayField(new fields.SchemaField({
			pool: new DicePoolField(),
			value: new fields.StringField()
		}));

		return schema;
	}

	prepareDerivedData() {
		this.suspense.value = 0;
		for (const step in this.suspense.steps) {
			if (this.suspense.steps[step]) this.suspense.value++;
		}
	}

	static migrateData(source) {
		if (!source.pool && source.roll) {
			source.pool = source.roll;
		}
		return super.migrateData(source);
	}

}
