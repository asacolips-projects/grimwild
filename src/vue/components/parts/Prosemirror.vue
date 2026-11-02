<template>
	<!-- Editable: the sheet creates a single ProseMirror editor per field and it
		lives for the lifetime of the sheet, so re-renders never destroy in-progress
		edits. Non-editable: static enriched HTML only. -->
	<div v-if="editable" ref="host" class="prose-mirror-wrapper"></div>
	<div v-else class="prose-mirror-wrapper" v-html="field.enriched"></div>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps(["field", "editable"]);
const document = inject("rawDocument");
const host = ref(null);
let editor = null;
let createToken = 0;

/**
 * Create the editor element and append it to the host.
 *
 * The enriched HTML must be passed to create() - it is captured by the
 * element's constructor to populate the collapsed preview, so setting
 * innerHTML afterwards would be ignored.
 */
async function createEditor() {
	if (!props.editable || !props.field?.name) return;
	const token = ++createToken;
	const element = await foundry.applications.elements.HTMLProseMirrorElement.create({
		name: props.field.name,
		value: props.field.value ?? "",
		enriched: props.field.enriched,
		toggled: true,
		collaborate: true,
		documentUUID: document?.uuid,
		height: props.field.height ?? 300
	});
	// A newer creation superseded this one.
	if (token !== createToken) {
		element.remove();
		return;
	}
	editor = element;
	host.value?.appendChild(element);
}

// Re-create the collapsed editor when its enriched preview changes (e.g.
// after saving, or an update from another client). While the editor is
// actively being edited it is left alone; collaboration keeps the open view
// in sync with the document.
watch(() => props.field?.enriched, () => {
	if (!editor || editor.classList.contains("active")) return;
	editor.remove();
	editor = null;
	createEditor();
});

// Handle edit permission changing while the sheet is open.
watch(() => props.editable, (editable) => {
	if (!editable && editor) {
		createToken++; // Invalidate any in-flight creation.
		editor.remove();
		editor = null;
	}
	else if (editable && !editor) {
		createEditor();
	}
});

onMounted(() => createEditor());

onBeforeUnmount(() => {
	createToken++;
	editor?.remove();
	editor = null;
});
</script>
