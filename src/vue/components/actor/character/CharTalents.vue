<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
			<!-- Header row -->
			<li class="flexrow items-header stroke stroke-bottom">
				<div class="item-name">Talent Name</div>
				<div class="item-controls">
					<template v-if="context.editable">
						<button class="item-control item-create"
							title="Create item"
							data-action="createDoc"
							data-document-class="Item"
							data-type="talent"
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
						:data-pack="context?.ceRulesEnabled ? 'grimwild.gwce-talents' : 'grimwild.talents'"
					><i class="fas fa-atlas"></i>Compendium</button>
				</div>
			</li>
			<!-- Talent rows -->
			<ItemRow v-for="item in context.itemTypes.talent" :key="item.id"
				:item="item"
				:context="context"
				item-type="talent"
			>
				<template #description>
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
</script>
