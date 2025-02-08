import GrimwildActorBase from "./base-actor.mjs";

export default class GrimwildMonster extends GrimwildActorBase {
	static LOCALIZATION_PREFIXES = ["GRIMWILD.Actor.Monster"];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const schema = super.defineSchema();

		schema.role = new fields.StringField({ required: false, blank: true });

		schema.pool = new fields.SchemaField({
			value: new fields.NumberField({
				...requiredInteger,
				initial: 1,
				min: 0
			})
		});

		return schema;
	}

	prepareDerivedData() {
		// Pass.
	}
}
