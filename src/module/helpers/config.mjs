export const GRIMWILD = {};

/**
 * The set of Stat Scores used within the system.
 * @type {object}
 */
GRIMWILD.stats = {
	bra: "GRIMWILD.Stat.bra.long",
	agi: "GRIMWILD.Stat.agi.long",
	wit: "GRIMWILD.Stat.wit.long",
	pre: "GRIMWILD.Stat.pre.long"
};

GRIMWILD.statAbbreviations = {
	bra: "GRIMWILD.Stat.bra.abbr",
	agi: "GRIMWILD.Stat.agi.abbr",
	wit: "GRIMWILD.Stat.wit.abbr",
	pre: "GRIMWILD.Stat.pre.abbr"
};

GRIMWILD.classes = {
	cleric: "GRIMWILD.Class.cleric.label",
	fighter: "GRIMWILD.Class.fighter.label",
	rogue: "GRIMWILD.Class.rogue.label",
	wizard: "GRIMWILD.Class.wizard.label"
};

export const isPhysicalStat = (stat) => {
	return stat === "bra" || stat === "agi";
};

export const isMentalStat = (stat) => {
	return !isPhysicalStat(stat);
};
