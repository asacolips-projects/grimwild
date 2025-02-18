
const fields = foundry.data.fields;
const requiredInteger = { required: true, nullable: false, integer: true };
const requiredString = { required: true, blank: true };
const optionalString = { required: false, blank: true };

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

export class CrucibleTableField extends fields.SchemaField {
	constructor(options, context = {}) {
		const tableFields = {
			// Table name.
			name: new fields.StringField(requiredString),
			// Table roll instructions.
			instructions: new fields.StringField(optionalString),
			// Table results.
			table: new fields.ArrayField( // Column.
				new fields.ArrayField( // Row.
					new fields.StringField(requiredString) // Value.
				)
			)
		};

		super(tableFields, options, context);
	}
}
