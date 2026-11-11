import { computed } from "vue";

/**
 * Encumbrance state for a character: 2 + Brawn slots, filled by gear and
 * arcana slot sizes. Used anywhere the encumbrance display renders (gear and
 * arcana tabs), so the math lives in one place.
 *
 * @param {object} context  The sheet context.
 * @returns {object}        Reactive slotsUsed, slotsMax, and encumbranceClass
 *                          (empty, encumbered past capacity, or overencumbered
 *                          past double capacity).
 */
export function useEncumbrance(context) {
	const slotsMax = computed(() => 2 + (context.system.stats?.bra?.value ?? 0));
	const slotsUsed = computed(() => {
		const items = [...(context.itemTypes.gear ?? []), ...(context.itemTypes.arcana ?? [])];
		return items.reduce((sum, item) => sum + (item.system.slotSize ?? 0), 0);
	});
	const encumbranceClass = computed(() => {
		if (slotsUsed.value > slotsMax.value * 2) return "overencumbered";
		if (slotsUsed.value > slotsMax.value) return "encumbered";
		return "";
	});

	return { slotsUsed, slotsMax, encumbranceClass };
}
