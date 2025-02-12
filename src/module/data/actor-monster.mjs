import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField, CrucibleTableField } from "../helpers/schema.mjs";

export default class GrimwildMonster extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Actor.base",
		"GRIMWILD.Actor.Monster"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		schema.role = new fields.StringField({ required: false, blank: true });
		schema.category = new fields.StringField({});

		schema.traits = new fields.ArrayField(new fields.StringField());
		schema.moves = new fields.ArrayField(new fields.StringField());

		schema.desires = new fields.ArrayField(new fields.SchemaField({
			are: new fields.BooleanField(),
			value: new fields.StringField()
		}));

		schema.sensories = new fields.SchemaField({
			colors: new fields.ArrayField(new fields.SchemaField({
				name: new fields.StringField(),
				color: new fields.ColorField(),
			})),
			sights: new fields.StringField(),
			sounds: new fields.StringField(),
			smells: new fields.StringField(),
		});

		schema.pool = new DicePoolField();
		schema.tables = new fields.ArrayField(new CrucibleTableField());

		return schema;
	}

	prepareBaseData() {
		// Ensure desires exist.
		for (let i = 0; i < 2; i++) {
			if (!this.desires[i]) {
				this.desires[i] = {
					are: i < 1,
					value: ""
				};
			}
		}

		// Ensure colors exist.
		for (let i = 0; i < 3; i++) {
			if (!this.sensories.colors[i]) {
				this.sensories.colors[i] = {
					name: '',
					color: '',
				};
			}
		}
	}

}
