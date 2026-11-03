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
					<button class="item-control item-compendium" type="button" data-action="openPack" data-pack="grimwild.arcana"><i class="fas fa-atlas"></i>Compendium</button>
				</div>
			</li>
			<!-- Arcana rows -->
			<ItemRow v-for="item in context.itemTypes.arcana" :key="item.id"
				:item="item"
				:context="context"
				item-type="arcana"
			>
				<template #description>
					<em>{{ getTier(item.system.tier) }}</em>
					<div class="item-touchstones" v-if="item.system.touchstones"><strong>Touchstones:</strong> <em>{{ item.system.touchstones }}</em></div>
					<div class="item-limitations" v-if="item.system.limitations">
						<strong>Limitations:</strong>
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
import { ItemRow } from "@/components";
const props = defineProps(["actor", "context"]);

/**
 * Get the display name for an arcana tier.
 * @param {string} tier  The arcana tier.
 * @returns {string} The display name.
 */
function getTier(tier) {
	switch (tier) {
		case "minor":
			return "Minor arcana";
		case "major":
			return "Major arcana";
		case "mythic":
			return "Mythic arcana";

		default:
			return "Minor arcana";
	}
}
</script>
