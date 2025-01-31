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

GRIMWILD.traits = {
	brave: "GRIMWILD.Traits.brave",
	caring: "GRIMWILD.Traits.caring",
	confident: "GRIMWILD.Traits.confident",
	curious: "GRIMWILD.Traits.curious",
	gentle: "GRIMWILD.Traits.gentle",
	honest: "GRIMWILD.Traits.honest",
	honorable: "GRIMWILD.Traits.honorable",
	persistent: "GRIMWILD.Traits.persistent",
	protective: "GRIMWILD.Traits.protective",
	quiet: "GRIMWILD.Traits.quiet",
	rash: "GRIMWILD.Traits.rash",
	stubborn: "GRIMWILD.Traits.stubborn",
}

GRIMWILD.desires = {
	belonging: "GRIMWILD.Desires.belonging",
	glory: "GRIMWILD.Desires.glory",
	harmony: "GRIMWILD.Desires.harmony",
	honor: "GRIMWILD.Desires.honor",
	justice: "GRIMWILD.Desires.justice",
	knowledge: "GRIMWILD.Desires.knowledge",
	love: "GRIMWILD.Desires.love",
	power: "GRIMWILD.Desires.power",
	renown: "GRIMWILD.Desires.renown",
	thrills: "GRIMWILD.Desires.thrills",
	wealth: "GRIMWILD.Desires.wealth",
	wisdom: "GRIMWILD.Desires.wisdom",
}

export const isPhysicalStat = (stat) => {
	return stat === "bra" || stat === "agi";
};

export const isMentalStat = (stat) => {
	return !isPhysicalStat(stat);
};
