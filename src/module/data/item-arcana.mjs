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
			initial: 'minor',
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

		// OBSOLETE ----------------------------------------------
		schema.quantity = new fields.NumberField({
			...requiredInteger,
			initial: 1,
			min: 1
		});
		schema.weight = new fields.NumberField({
			required: true,
			nullable: false,
			initial: 0,
			min: 0
		});

		// Break down roll formula into three independent fields
		schema.roll = new fields.SchemaField({
			diceNum: new fields.NumberField({
				...requiredInteger,
				initial: 1,
				min: 1
			}),
			diceSize: new fields.StringField({ initial: "d20" }),
			diceBonus: new fields.StringField({
				initial: "+@str.mod+ceil(@lvl / 2)"
			})
		});

		schema.formula = new fields.StringField({ blank: true });
		// --------------------------------------------------------

		return schema;
	}

	prepareDerivedData() {
		// Build the formula dynamically using string interpolation
		const roll = this.roll;

		this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`;
	}
}
