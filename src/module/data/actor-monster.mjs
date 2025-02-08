import GrimwildActorBase from "./base-actor.mjs";
import { DicePoolField } from "../helpers/schema.mjs";

export default class GrimwildMonster extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Actor.base",
		"GRIMWILD.Actor.Monster"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();

		schema.role = new fields.StringField({ required: false, blank: true });
		schema.pool = new DicePoolField();

		return schema;
	}

	prepareDerivedData() {
		// Pass.
	}
}
