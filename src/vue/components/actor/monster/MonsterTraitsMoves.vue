<template>
	<!-- Traits -->
	<fieldset class="traits-fieldset add-another-entries">
		<legend>{{ context.systemFields.traits.label }}</legend>
		<button class="trait-control legend-control entry-create"
			title="Add trait"
			data-action="createArrayEntry"
			data-field="traits"
		><i class="fas fa-plus"></i></button>
		<div class="traits entries form-group stacked">
			<div class="trait entry form-group stacked" v-for="(trait, key) in context.system.traits" :key="key">
				<input type="text"
					:name="`system.traits.${key}`"
					v-model="context.system.traits[key]"
					placeholder="Trait description"/>
				<a class="trait-control entry-delete"
					title="Delete trait"
					data-action="deleteArrayEntry"
					data-field="traits"
					:data-key="key"
				><i class="fas fa-trash"></i></a>
			</div>
		</div>
	</fieldset>
	
	<!-- Moves -->
	<fieldset class="moves-fieldset add-another-entries">
		<legend>{{ context.systemFields.moves.label }}</legend>
		<button class="move-control legend-control entry-create"
			title="Add move"
			data-action="createArrayEntry"
			data-field="moves"
		><i class="fas fa-plus"></i></button>
		<div class="moves entries form-group stacked">
			<div class="move entry form-group stacked" v-for="(move, key) in context.system.moves" :key="key">
				<input type="text"
					:name="`system.moves.${key}`"
					v-model="context.system.moves[key]"
					placeholder="Trait description"/>
				<a class="move-control entry-delete"
					title="Delete move"
					data-action="deleteArrayEntry"
					data-field="moves"
					:data-key="key"
				><i class="fas fa-trash"></i></a>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import { inject } from "vue";
// import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
// const actor = inject("rawDocument");
</script>