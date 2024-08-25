<template>
  <!-- <div class="prose-mirror-wrapper" v-html="editable ? field.element.outerHTML : field.enriched"></div> -->
  <div class="prose-mirror-wrapper" v-html="elementHTML"></div>
</template>

<script setup>
import { toRaw } from 'vue';
const props = defineProps(['field', 'document', 'toggled', 'collaborate', 'height', 'editable']);
const { field, toggled, collaborate, height } = props;
const document = toRaw(props.document);

const content = foundry.utils.getProperty(document, field);
const element = foundry.applications.elements.HTMLProseMirrorElement.create({
  name: field,
  value: content,
  documentUUID: document.uuid,
  toggled: toggled ?? true,
  collaborate: collaborate ?? true,
  height: height ?? 300,
});

element.innerHTML = await TextEditor.enrichHTML(
  content,
  {
    secrets: document.isOwner,
    rolldata: document.getRollData(),
    relativeTo: document,
  },
);

const elementHTML = element.outerHTML;

</script>