import { DicePoolField, CrucibleTableField } from "../helpers/schema.mjs";
import GrimwildItemBase from "./base-item.mjs";

export default class GrimwildTalent extends GrimwildItemBase {
	static LOCALIZATION_PREFIXES = [
		"GRIMWILD.Item.base",
		"GRIMWILD.Item.Talent"
	];

	static defineSchema() {
		const fields = foundry.data.fields;
		const requiredInteger = { required: true, nullable: false, integer: true };
		const optionalString = { required: false, blank: true };
		const schema = super.defineSchema();

		// The path this talent belongs to
		schema.path = new fields.StringField();

		// If the talent is a core talent
		schema.core = new fields.BooleanField();

		// Ex: Spell theorems
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

		// Crucible.
		schema.crucible = new CrucibleTableField();

		return schema;
	}

	async rollCrucible(options = {}) {
		const row = new Roll('d6');
		const col = new Roll('d6');

		await row.roll();
		await col.roll();

		const result = [
			this.crucible.table[row.result][col.result],
			this.crucible.table[col.result][row.result],
		];

		if (options?.toMessage) {
			ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ actor: this.parent }),
				content: `
				  <section class="grimwild-chat grimwild-roll stroke stroke-top">
						<div class="results">
							<h2>${this.crucible.name ?? 'Crucible'}</h2>
							<div class="crucible-results flexcol">
								<strong>${result[0]}</strong>
								<strong>${result[1]}</strong>
							</div>
						</div>
						<div class="dice-tooltip expanded">
							<section class="tooltip-part">
								<div class="dice">
									<ul class="dice-rolls">
										<li class="roll die d6 grim">${row.result}</li>
										<li class="roll die d6 grim">${col.result}</li>
									</ul>
								</div>
							</section>
						</div>
					</section>
				`,
			})
		}

		return result;
	}

	/**
	 * Migrate source data from prior format to the new specification.
	 *
	 * Note that these changes are not persisted to the database. An
	 * update operation on that field has to occur for them to actually
	 * stick. This usually isn't an issue since it's fairly lightweight
	 * data coercion, but if there's a significant schema change across
	 * a large number of documents, then there should also be a custom
	 * migration called during the ready hook to apply the changes long
	 * term by forcibly resaving the fields on the actors/items.
	 *
	 * @inheritDoc
	 */
	static migrateData(source) {
		// Example of when resources were migrated to use trackers.
		if (source.resources?.length > 0) {
			source.trackers = [...source.resources];
		}
		return super.migrateData(source);
	}
}
