<template>
  <!-- PDF-style read-only stat block. Static markup only: no name attributes,
      so nothing here can submit to the form pipeline. -->
  <article class="gear-view">
    <!-- View/edit toggle -->
    <slot name="actions"></slot>
    <header class="gear-view-header">
      <img class="gear-view-img" :src="context.item.img" :alt="context.item.name"/>
      <h2 class="gear-view-name">{{ context.item.name }}</h2>
      <span v-if="context.encumbranceEnabled" class="gear-view-slots">{{ slotLabel(context.system.slotSize) }}</span>
    </header>
    <!-- Details -->
    <div class="gear-view-details" v-html="context.editors['system.description'].enriched"></div>
    <!-- Notes -->
    <div v-if="context.system.notes.description" class="gear-view-notes stroke stroke-top">
      <strong>{{ context.system.notes.label.length > 0 ? context.system.notes.label : context.systemFields.notes.label }}:</strong>
      <div v-html="context.editors['system.notes.description'].enriched"></div>
    </div>
    <!-- Trackers. TrackersRow needs the full document for its data-item-id,
        so it gets the raw document rather than the toObject() copy on the
        context. -->
    <TrackersRow v-if="context.item.system?.trackers?.length > 0" :item-id="itemDocument.id" :trackers="context.item.system.trackers" class="stroke stroke-top"/>
  </article>
</template>

<script setup>
import { inject } from "vue";
import { slotLabel } from "@/format.mjs";
import { TrackersRow } from "@/components";

const props = defineProps(["context"]);
// The full item document (non-reactive), provided by the sheet class.
const itemDocument = inject("rawDocument", props.context.item);
</script>
