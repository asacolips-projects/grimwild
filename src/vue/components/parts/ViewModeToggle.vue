<template>
	<!-- Sliding view/edit mode switch. Off = view mode (dark pill, knob left),
		on = edit mode (tan pill, knob right). -->
	<button type="button"
		class="view-mode-toggle"
		:class="{ active: props.active }"
		:data-tooltip="props.label"
		:aria-label="props.label"
		:aria-pressed="props.active ? 'true' : 'false'"
		@click="emit('toggle')"
	><span class="view-mode-knob"><i class="fas fa-wrench"></i></span></button>
</template>

<script setup>
const props = defineProps(["active", "label"]);
const emit = defineEmits(["toggle"]);
</script>
