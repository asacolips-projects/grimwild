<template>
  <h1>Hello, {{context.actor.name ?? 'nobody'}}!</h1>
  <em>[{{ context.actor.uuid }}]</em>
  <input type="text" name="name" v-model="context.actor.name"/>
  <!-- <Editor :editable="context.editable" :field="context.editors['system.biography']"/> -->
  <Editor field="system.biography" :document="context.actor" :enriched="context.editors['system.biography'].enriched" toggled="true" collaborate="true" height="300" />
</template>

<script setup>
import Editor from '@/components/Editor.vue';
const props = defineProps(['context']);

</script>