export default class GrimwildActorBase extends foundry.abstract
	.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		// const requiredInteger = { required: true, nullable: false, integer: true };
		const schema = {};

		schema.biography = new fields.HTMLField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields
		schema.notes = new fields.HTMLField({ required: true, blank: true });

		return schema;
	}
}
