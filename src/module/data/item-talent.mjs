import { DicePoolField } from "../helpers/schema.mjs";
import GrimwildItemBase from "./base-item.mjs";

export default class GrimwildTalent extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Talent"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const requiredString = { required: true, blank: true };
		const optionalString = { required: false, blank: true };
		const schema = super.defineSchema();

		// Ex: Spell theorems
		schema.notes = new fields.SchemaField({
			label: new fields.StringField(optionalString),
			description: new fields.StringField(optionalString),
		});

		schema.resources = new fields.SchemaField({
			// Ex: Patron patience, cleric spells.
			pools: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField(optionalString),
				description: new fields.StringField(optionalString),
				value: new DicePoolField(),
			})),
			// Ex: Spells, sorcerer essence.
			points: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField(optionalString),
				description: new fields.StringField(optionalString),
				// Whether or not to show checkboxes or just a raw number field.
				showSteps: new fields.BooleanField(),
				// Track the actual value numerically.
				value: new fields.NumberField({
					...requiredInteger,
					initial: 0,
					min: 0,
				}),
				max: new fields.NumberField({
					min: 1,
				}),
			})),
			// Ex: Push on various talents.
			toggles: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField(optionalString),
				description: new fields.StringField(optionalString),
				value: new fields.BooleanField(),
			})),
			// Ex: ...maybe not needed? TBD on this one.
			text: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField(optionalString),
				description: new fields.StringField(optionalString),
				value: new fields.StringField(optionalString),
			})),
		});

		return schema;
	}
}
