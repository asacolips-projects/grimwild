<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
			<!-- Header row -->
			<li class="flexrow items-header stroke stroke-bottom">
				<div class="item-name">Arcana Name</div>
				<div class="item-controls">
					<template v-if="context.editable">
						<button class="item-control item-create"
							title="Create item"
							data-action="createDoc"
							data-document-class="Item"
							data-type="arcana"
							type="button"
						>
							<i class="fas fa-plus"></i><span>Add</span>
						</button>
					</template>
					<button
						class="item-control
						item-compendium"
						type="button"
						data-action="openPack"
						:data-pack="context?.ceRulesEnabled ? 'grimwild.gwce-arcana' : 'grimwild.arcana'"
					><i class="fas fa-atlas"></i>Compendium</button>
				</div>
			</li>
			<!-- Arcana rows -->
			<ItemRow v-for="item in context.itemTypes.arcana" :key="item.id"
				:item="item"
				:context="context"
				item-type="arcana"
			>
				<template #description>
					<ColorBar v-if="item.system.palette" :colors="item.system.palette"/>
					<em>{{ game.i18n.localize(`GRIMWILD.Arcana.${item.system.tier ?? "minor"}`) }}</em>
					<div class="item-touchstones" v-if="item.system.touchstones"><strong>{{getItemFieldLabel(item, "touchstones")}}:</strong> <em>{{ item.system.touchstones }}</em></div>
					<!-- Sensories -->
					<div v-if="item.system.sensories.descriptors" class="item-sensories-descriptors">
						<i class="fas fa-fan"></i> <em>{{ item.system.sensories.descriptors }}</em>
					</div>
					<div v-if="item.system.sensories.actions" class="item-sensories-actions">
						<i class="fas fa-hand-paper"></i> <em>{{ item.system.sensories.actions }}</em>
					</div>
					<!-- Activation -->
					<div v-if="item.system.activation" class="item-activation">
						<strong>{{ getItemFieldLabel(item, "activation") }}:</strong> <em>{{ item.system.activation }}</em>
					</div>
					<div class="item-limitations" v-if="item.system.limitations">
						<strong>{{ getItemFieldLabel(item, "limitations") }}:</strong>
						<div class="item-limitations-description" v-html="context.editors[`items.${item.id}.system.limitations`].enriched"></div>
					</div>
					<hr/>
					<div class="item-description" v-html="context.editors[`items.${item.id}.system.description`].enriched"></div>
					<div v-if="item.system.notes.description" class="item-notes">
						<strong v-if="item.system.notes.label">{{ item.system.notes.label }}</strong>
						<div class="item-notes-description" v-html="context.editors[`items.${item.id}.system.notes.description`].enriched"></div>
					</div>
				</template>
			</ItemRow>
		</ol>
	</section>
</template>

<script setup>
import { ItemRow, ColorBar } from "@/components";
const props = defineProps(["actor", "context"]);

/**
 * Get the field label for an item.
 * @param {object} item  Item document.
 * @param {string} field Field name.
 * @returns {string} Field label.
 */
function getItemFieldLabel(item, field) {
	return item.system.schema?.fields?.[field]?.label ?? "";
}
</script>
