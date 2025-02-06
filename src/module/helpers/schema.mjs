
const fields = foundry.data.fields;
const requiredInteger = { required: true, nullable: false, integer: true };

export class DicePoolField extends fields.SchemaField {
	constructor(options, context = {}) {
		const dpFields = {
			diceNum: new fields.NumberField({
				...requiredInteger,
				initial: 0,
				min: 0
			}),
			max: new fields.NumberField({
				min: 0
			})
		};
		super(dpFields, options, context);
	}
}
