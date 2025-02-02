<template>
  <fieldset>
    <legend>{{ context.systemFields.description.label }}</legend>
    <div class="form-group">
      <div class="field">
        <Prosemirror :editable="context.editable" :field="context.editors['system.description']"/>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import {
	Prosemirror
} from '@/components';
const props = defineProps(['item', 'context']);
</script>