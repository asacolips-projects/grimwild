import { DicePoolField } from "../helpers/schema.mjs";
import GrimwildItemBase from "./base-item.mjs";

export default class GrimwildArcana extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Arcana"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const optionalString = { required: false, blank: true };
		const schema = super.defineSchema();

		// Touchstones and limitations.
		schema.touchstones = new fields.StringField(optionalString);
		schema.limitations = new fields.HTMLField(optionalString);

		// Arcana type.
		schema.tier = new fields.StringField({
			initial: "minor"
		});

		// Arbitrary notes.
		schema.notes = new fields.SchemaField({
			label: new fields.StringField(optionalString),
			description: new fields.HTMLField({ required: true, blank: true })
		});

		// Resources V2.
		schema.trackers = new fields.ArrayField(new fields.SchemaField({
			type: new fields.StringField({
				required: true,
				blank: false,
				choices: {
					pool: "Pool",
					points: "Points"
				}
			}),
			label: new fields.StringField(optionalString),
			pool: new DicePoolField(),
			points: new fields.SchemaField({
				showSteps: new fields.BooleanField(),
				value: new fields.NumberField({
					...requiredInteger,
					initial: 1,
					min: 0
				}),
				max: new fields.NumberField({
					initial: 1,
					min: 1
				})
			})
		}));

		return schema;
	}

	prepareDerivedData() {}
}
