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
			description: new fields.HTMLField({ required: true, blank: true }),
		});

		// Resources V2.
		schema.trackers = new fields.ArrayField(new fields.SchemaField({
			type: new fields.StringField({
				required: true,
				blank: false,
				choices: {
					pool: 'Pool',
					points: 'Points',
				},
			}),
			label: new fields.StringField(optionalString),
			pool: new DicePoolField(),
			points: new fields.SchemaField({
				showSteps: new fields.BooleanField(),
				value: new fields.NumberField({
					...requiredInteger,
					initial: 1,
					min: 0,
				}),
				max: new fields.NumberField({
					initial: 1,
					min: 1,
				})
			})
		}));

		return schema;
	}

	/**
	 * Migrate source data from prior format to the new specification.
	 *
	 * Note that these changes are not persisted to the database. An
	 * update operation on that field has to occur for them to actually
	 * stick. This usually isn't an issue since it's fairly lightweight
	 * data coercion, but if there's a significant schema change across
	 * a large number of documents, then there should also be a custom
	 * migration called during the ready hook to apply the changes long
	 * term by forcibly resaving the fields on the actors/items.
	 * 
	 * @inheritDoc
	 */
	static migrateData(source) {
		// Example of when resources were migrated to use trackers.
		if (source.resources?.length > 0) {
			source.trackers = [...source.resources];
		}
		return super.migrateData(source);
	}
}
