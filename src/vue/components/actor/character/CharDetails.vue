<template>
	<fieldset>
		<legend>{{ game.i18n.localize('GRIMWILD.Actor.base.FIELDS.biography.label') }}</legend>
		<div class="form-group">
			<div class="field">
				<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import {
	Prosemirror
} from '@/components';
const props = defineProps(['actor', 'context']);
</script>