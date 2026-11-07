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
			steps: new fields.ArrayField(new fields.BooleanField(), {
				initial: [true, true]
			})
		});

		schema.traits = new fields.ArrayField(
			new fields.StringField(),
			{ initial: ["", ""] }
		);
		schema.moves = new fields.ArrayField(
			new fields.StringField(),
			{ initial: ["", "", ""] }
		);

		schema.failure = new fields.ArrayField(new fields.SchemaField({
			pool: new DicePoolField(),
			value: new fields.StringField()
		}));

		// Links between sibling challenges, rendered in the columns view.
		schema.links = new fields.ArrayField(new fields.SchemaField({
			// Id of the challenge Item this link points at, on the same actor.
			target: new fields.DocumentIdField({
				required: true
			}),
			// Anchor ids where the line attaches on each end (e.g. "left-top",
			// "bottom", "corner-top-left").
			fromAnchor: new fields.StringField({
				required: false,
				blank: true,
				initial: ""
			}),
			toAnchor: new fields.StringField({
				required: false,
				blank: true,
				initial: ""
			}),
			style: new fields.StringField({
				required: true,
				initial: "solid",
				choices: ["solid", "dashed", "dotted", "squiggle"]
			}),
			arrow: new fields.StringField({
				required: true,
				initial: "fwd",
				choices: ["none", "fwd", "rev", "both"]
			}),
			label: new fields.StringField({
				required: false,
				blank: true,
				initial: ""
			})
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
