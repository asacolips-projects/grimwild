<template>
  <h1>Hello, {{context.actor.name ?? 'nobody'}}!</h1>
  <em>[{{ context.actor.uuid }}]</em>
  <input type="text" name="name" v-model="context.actor.name"/>
  <Editor :editable="context.editable" :field="context.editors['system.biography']"/>
</template>

<script setup>
import Editor from '@/components/Editor.vue';
const props = defineProps(['context']);

</script>