export class GrimwildRollTable extends foundry.documents.RollTable {
	async _preUpdate(changes, options, user) {
		await super._preUpdate(changes, options, user);

		if (changes?.flags?.core?.sheetClass === "grimwild.GrimwildRollTableCrucibleSheet") {
			if (this.results && this.results.size < 36) {
				const results = Array.fromRange(36 - this.results.size, 1).map((result) => {
					return {
						name: "",
						range: [result, result],
						weight: 1,
						_id: foundry.utils.randomID()
					};
				});
				changes.formula = "1d36";
				changes.results = results;
			}
		}
	}

	async roll({ roll, recursive=true, _depth=0 }={}) {
		if (this.isCrucible()) {
			// @todo tie this to the rollCrucible() method.
			return super.roll({ roll, recursive, _depth });
		}

		return super.roll({ roll, recursive, _depth });

	}

	isCrucible() {
		return this.getFlag("core", "sheetClass") === "grimwild.GrimwildRollTableCrucibleSheet";
	}

	getCrucibleTable() {
		if (this.isCrucible()) {
			const grid = {
				1: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
				2: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
				3: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
				4: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
				5: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
				6: { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" }
			};
			let row = 1;
			let col = 1;
			let count = 0;
			this.results.forEach((result) => {
				if (count < 36) {
					grid[row][col] = result.name;
					col++;
					if (col === 7) {
						row++;
						col = 1;
					}
					count++;
				}
			});

			return grid;
		}
	}

	async rollCrucible({ toMessage=true }={}) {
		const crucibleRoll = new grimwild.rollCrucible("{2d6}", {}, {
			crucible: {
				name: this.name,
				instructions: "",
				table: this.getCrucibleTable()
			}
		});

		await crucibleRoll.roll();
		if (toMessage) {
			crucibleRoll.toMessage();
		}

		return crucibleRoll;
	}
}
