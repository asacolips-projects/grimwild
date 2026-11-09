<template>
  <!-- PDF-style read-only stat block. Static markup only: no name attributes,
      so nothing here can submit to the form pipeline. -->
  <article class="arcana-view">
    <!-- View/edit toggle -->
    <slot name="actions"></slot>
    <header class="arcana-view-header">
      <img class="arcana-view-img" :src="context.item.img" :alt="context.item.name"/>
      <h2 class="arcana-view-name">{{ context.item.name }}</h2>
      <span class="arcana-view-tier">{{ game.i18n.localize(`GRIMWILD.Arcana.${context.system.tier ?? "minor"}`) }}</span>
    </header>
    <ColorBar :colors="context.system.palette"/>
    <!-- Details -->
    <div class="arcana-view-details" v-html="context.editors['system.description'].enriched"></div>
    <!-- Touchstones -->
    <div v-if="context.system.touchstones" class="arcana-view-touchstones stroke stroke-top">
      {{ context.system.touchstones }}
    </div>
    <!-- Sensories -->
    <div v-if="context.system.sensories.descriptors" class="arcana-view-sensory stroke stroke-top">
      <i class="fas fa-fan"></i> <em>{{ context.system.sensories.descriptors }}</em>
    </div>
    <div v-if="context.system.sensories.actions" class="arcana-view-sensory">
      <i class="fas fa-hand-paper"></i> <em>{{ context.system.sensories.actions }}</em>
    </div>
    <!-- Activation -->
    <div v-if="context.system.activation" class="arcana-view-activation stroke stroke-top">
      <strong>{{ context.systemFields.activation.label }}:</strong> <em>{{ context.system.activation }}</em>
    </div>
    <!-- Limitations -->
    <div v-if="context.system.limitations" class="arcana-view-limitations stroke stroke-top">
      <strong>{{ context.systemFields.limitations.label }}:</strong>
      <div v-html="context.editors['system.limitations'].enriched"></div>
    </div>
    <!-- Notes -->
    <div v-if="context.system.notes.description" class="arcana-view-notes stroke stroke-top">
      <strong>{{ context.system.notes.label.length > 0 ? context.system.notes.label : context.systemFields.notes.label }}:</strong>
      <div v-html="context.editors['system.notes.description'].enriched"></div>
    </div>
  </article>
</template>

<script setup>
import {
	ColorBar
} from "@/components";

const props = defineProps(["context"]);
</script>
