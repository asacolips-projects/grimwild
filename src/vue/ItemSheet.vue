<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="grimwild-sheet-layout flexcol">
			<!-- View mode: read-only stat block. The view branch is the base
				pattern for document sheets: other doc types add a view component.
				hasViewMode (from the sheet class) gates which types get it. -->
			<template v-if="showView">
				<ArcanaView v-if="context.item.type === 'arcana'" :context="context">
					<template #actions>
						<ViewModeToggle v-if="context.editable"
							:active="!viewMode"
							:label="viewMode ? editLabel : viewLabel"
							@toggle="toggleViewMode"
						/>
					</template>
				</ArcanaView>
				<GearView v-if="context.item.type === 'gear'" :context="context">
					<template #actions>
						<ViewModeToggle v-if="context.editable"
							:active="!viewMode"
							:label="viewMode ? editLabel : viewLabel"
							@toggle="toggleViewMode"
						/>
					</template>
				</GearView>
			</template>

			<!-- Edit mode -->
			<section v-else class="grimwild-main flexcol grid-span-3">
				<ItemHeader :context="context">
					<template #actions>
						<ViewModeToggle v-if="context.hasViewMode && context.editable"
							:active="!viewMode"
							:label="viewMode ? editLabel : viewLabel"
							@toggle="toggleViewMode"
						/>
					</template>
				</ItemHeader>
				<!-- Palette (ARCANA ONLY) -->
				<ColorBar v-if="context.item.type === 'arcana'" :colors="context.system.palette"/>

				<div class="section--main flexcol">
					<!-- Tab links -->
					<Tabs :tabs="tabs.primary" no-span="true"/>

					<section class="section--fields">
						<!-- Details fields -->
						<Tab group="primary" :tab="tabs.primary.description">
							<!-- Description -->
							<ItemDescription :item="context.item" :context="context"/>
							<!-- Notes -->
							<fieldset v-if="context.system?.notes">
								<legend>Notes</legend>
								<div class="notes form-group stacked">
									<label>Label</label>
									<input type="text" :name="`system.notes.label`" v-model="context.system.notes.label"/>
								</div>
								<div class="field">
									<Prosemirror :editable="context.editable" :field="context.editors['system.notes.description']"/>
								</div>
							</fieldset>
						</Tab>

						<!-- Attack fields. Guarded: not every type defines the tab in
							_prepareTabs, and Tab.vue cannot handle an undefined tab. -->
						<Tab v-if="tabs.primary.attributes" group="primary" :tab="tabs.primary.attributes">
							<!-- Arcana Details -->
							<ArcanaDetails v-if="context.item.type === 'arcana'" :context="context"/>
							<!-- Trackers -->
							<ItemAttributes :context="context" />
						</Tab>

						<!-- @todo Active effects disabled for now. -->
						<!-- Active Effect Fields -->
						<!-- <Tab group="primary" :tab="tabs.primary.effects">
							Effects
						</Tab> -->
					</section>
				</div>
			</section>
		</div>

	</div>
</template>

<script setup>
import { computed, ref } from "vue";
import {
	Tabs,
	Tab,
	ItemHeader,
	ItemDescription,
	ItemAttributes,
	Prosemirror,
	ArcanaDetails,
	ArcanaView,
	GearView,
	ColorBar,
	ViewModeToggle
} from "@/components";
import { useTabs } from "@/composables/useTabs";

const props = defineProps(["context"]);
// Copy the tabs into a local reactive object so that tab state (which tab is
// active) survives context synchronization on re-render.
const tabs = useTabs(props.context);

// View/edit mode. Component-local so it survives re-render syncs; resets when
// the sheet closes. View is the default; only editable viewers get the toggle.
const viewMode = ref(true);
const viewLabel = game.i18n.localize("GRIMWILD.UI.View");
const editLabel = game.i18n.localize("GRIMWILD.UI.Edit");
const showView = computed(() => props.context.hasViewMode && viewMode.value);

/**
 * Toggle the sheet between the read-only view and the edit form.
 */
function toggleViewMode() {
	viewMode.value = !viewMode.value;
}
</script>
