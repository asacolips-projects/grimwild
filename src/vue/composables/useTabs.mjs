import { reactive, toRaw } from "vue";

/**
 * Copy the sheet-provided tabs into a local reactive object so that tab state
 * (which tab is active) survives context synchronization on re-render.
 *
 * @param {object} context  The sheet render context.
 * @returns {object} Local reactive tabs.
 */
export function useTabs(context) {
	return reactive({ ...toRaw(context.tabs) });
}
