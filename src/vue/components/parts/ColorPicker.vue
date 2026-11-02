<template>
	<!-- Editable: a Foundry color picker element created once per entry.
		Non-editable: a disabled color input. -->
	<input v-if="!editable" type="color" :value="picker?.value ?? '#000000'" disabled />
	<div v-else ref="host"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps(["picker", "editable"]);
const host = ref(null);
let pickerElement = null;

onMounted(async () => {
	if (!props.editable || !props.picker?.name) return;
	const element = await foundry.applications.elements.HTMLColorPickerElement.create({
		name: props.picker.name,
		value: props.picker.value
	});
	pickerElement = element;
	host.value?.appendChild(element);
});

onBeforeUnmount(() => {
	pickerElement?.remove();
	pickerElement = null;
});
</script>
