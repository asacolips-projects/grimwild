import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField } from "../helpers/schema.mjs";

export default class GrimwildLinkedChallenge extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Actor.base",
		"GRIMWILD.Actor.LinkedChallenge"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		schema.suspense = new fields.SchemaField({
			steps: new fields.ArrayField(new fields.BooleanField())
		});

		schema.traits = new fields.ArrayField(new fields.StringField());
		schema.moves = new fields.ArrayField(new fields.StringField());

		schema.failure = new fields.ArrayField(new fields.SchemaField({
			pool: new DicePoolField(),
			value: new fields.StringField(),
		}));

		return schema;
	}

	prepareDerivedData() {
		this.suspense.value = 0;
		for (const step in this.suspense.steps) {
			if (this.suspense.steps[step]) this.suspense.value++;
		}
	}
}