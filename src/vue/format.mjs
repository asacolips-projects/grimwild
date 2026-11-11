/**
 * Format an item's slot size for display ("½ slot", "1 slot", "2 slots").
 * @param {number} size  The item's slot size.
 * @returns {string}     The formatted label.
 */
export function slotLabel(size) {
	if (size === 0.5) return game.i18n.localize("GRIMWILD.Item.Gear.HalfSlot");
	return game.i18n.localize("GRIMWILD.Item.Gear.Slots", { slots: size });
}
