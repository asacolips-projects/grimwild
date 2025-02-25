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
				:name="fieldNameProp"
				:value="pool.diceNum"
				:min="min"
				:max="max"
			/>
			<span class="roll-pool-suffix">d</span>
		</template>
	</div>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps([
	'name',
	'buttonAction',
	'buttonRollType',
	'buttonLabel',
	'inputAction',
	'field',
	'fieldKey',
	'fieldName',
	'noInput',
	'itemId',
	'pool',
	'min',
	'max'
]);

if (!props.buttonAction) props.buttonAction = 'rollPool';
if (!props.min) props.min = 0;

let fieldNameProp = null;
if (props.fieldName) {
	fieldNameProp = props.fieldName;
} else if (props.field) {
	fieldNameProp = `system.${props.field}.diceNum`;
}

</script>