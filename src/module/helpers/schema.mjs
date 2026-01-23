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
			}),
			powerPool: new fields.BooleanField()
		};
		super(dpFields, options, context);
	}
}

export class CrucibleTableField extends fields.SchemaField {
	constructor(options, context = {}) {

		/* ------------------------------------------------- */
		// Build our table structure with nested schema fields.
		/* ------------------------------------------------- */
		// Build the outer columns.
		const cols = {};
		const d66 = Array.fromRange(6, 1);
		d66.forEach((col) => {
			// Build the inner rows.
			const rows = {};
			d66.forEach((row) => {
				// Inner string for the actual value.
				rows[row] = new fields.StringField(requiredString);
			});
			// Inner schema for rows.
			cols[col] = new fields.SchemaField(rows);
		});
		// Outer schema for cols.
		const tableSchema = new fields.SchemaField(cols);

		/* ------------------------------------------------- */

		// Prepare the table fields for the data model.
		const tableFields = {
			// Table name.
			name: new fields.StringField(requiredString),
			// Table roll instructions.
			instructions: new fields.StringField(optionalString),
			// Table results. Outer schema is columns, inner schema is rows.
			table: tableSchema
		};

		super(tableFields, options, context);
	}
}
