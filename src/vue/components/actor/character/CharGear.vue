<template>
	<section class="grid grid-3col">
		<ol class="items-list grid-span-3">
			<!-- Header row -->
			<li class="flexrow items-header stroke stroke-bottom">
				<div class="item-name">{{ game.i18n.localize("GRIMWILD.Item.Gear.Header") }}</div>
				<!-- Slots (CE OPTIONAL RULE) -->
				<div v-if="context.encumbranceEnabled" class="encumbrance-slots form-group stacked">
					<div>{{ game.i18n.localize("GRIMWILD.Encumbrance.label") }}: <span :class="`encumbrance-current ${encumbranceClass}`">{{ slotsUsed }} / {{ slotsMax }}</span></div>
				</div>
				<div class="item-supplies flexrow" v-if="context?.suppliesEnabled">
					<label>{{ context.systemFields.supplies.label }}</label>
					<RollPoolInput
						button-action="rollPool"
						field="supplies"
						field-name="system.supplies.pool.diceNum"
						:pool="context.system.supplies.pool"
						min="0"
						:max="context.system.supplies.pool.max"
						suffix="d"
					/>
				</div>
				<div class="item-controls">
					<template v-if="context.editable">
						<button class="item-control item-create"
							title="Create item"
							data-action="createDoc"
							data-document-class="Item"
							data-type="gear"
							type="button"
						>
							<i class="fas fa-plus"></i><span>Add</span>
						</button>
					</template>
				</div>
			</li>
			<!-- Gear rows -->
			<ItemRow v-for="item in context.itemTypes.gear" :key="item.id"
				:item="item"
				:context="context"
				item-type="gear"
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
import { ItemRow, RollPoolInput } from "@/components";
import { useEncumbrance } from "@/composables/useEncumbrance.mjs";
const props = defineProps(["actor", "context"]);

const { slotsUsed, slotsMax, encumbranceClass } = useEncumbrance(props.context);
</script>
