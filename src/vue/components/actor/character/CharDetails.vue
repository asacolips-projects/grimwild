<template>
	<div class="form-group">
		<label>{{ game.i18n.localize('GRIMWILD.Actor.base.FIELDS.biography.label') }}</label>
	</div>
	<div class="field">
		<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
	</div>
</template>

<script setup>
import {
	Prosemirror
} from '@/components';
const props = defineProps(['actor', 'context']);
</script>