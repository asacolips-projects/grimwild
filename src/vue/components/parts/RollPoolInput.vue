<template>
	<div class="roll-pool form-group">
		<button class="roll-pool-button"
			:data-action="buttonAction"
			:data-roll-type="buttonRollType"
			:data-item-id="itemId"
			:data-field="field"
			:data-key="fieldKey"
		><i class="fas fa-dice-d6"></i><strong v-if="buttonLabel">{{ buttonLabel }}</strong></button>
		<template v-if="noInput">
			<span class="roll-pool-suffix">{{pool.diceNum}}d</span>
		</template>
		<template v-else>
			<input type="number"
				class="roll-pool-input"
				:data-action-change="inputAction"
				:data-item-id="itemId"
				:name="inputAction ? null : fieldNameProp"
				:value="pool.diceNum"
				:min="minProp"
				:max="max"
			/>
			<span class="roll-pool-suffix">{{ suffix ?? 'd' }}</span>
		</template>
	</div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps([
	"name",
	"buttonAction",
	"buttonRollType",
	"buttonLabel",
	"inputAction",
	"field",
	"fieldKey",
	"fieldName",
	"noInput",
	"itemId",
	"pool",
	"min",
	"max",
	"suffix"
]);

// When an inputAction is provided, the targeted change handler owns the write
// and no name attribute is rendered; otherwise the input joins the form
// submission under its system path.
const fieldNameProp = computed(() => {
	if (props.fieldName) return props.fieldName;
	if (props.field) return `system.${props.field}.diceNum`;
	return null;
});
const buttonAction = computed(() => props.buttonAction ?? "rollPool");
const minProp = computed(() => props.min ?? 0);
</script>
