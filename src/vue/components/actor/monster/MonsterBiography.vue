<template>
	<!-- Biography -->
	<fieldset class="fieldset-prose-mirror">
		<legend>{{ context.systemFields.biography.label }}</legend>
		<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
	</fieldset>

	<!-- Colors -->
	<fieldset>
		<legend>Colors</legend>
		<div class="form-group stacked">
			<div v-for="(color, colorKey) in context.system.sensories.colors"
				:key="colorKey"
				class="form-group"
			>
				<div class="form-group">
					<input type="text" 
						:name="`system.sensories.colors.${colorKey}.name`"
						v-model="color.name"
						placeholder="Name of color"
					/>
				</div>
				<div class="form-group"
					v-html="context.customElements[`system.sensories.colors.${colorKey}.color`].outerHTML"
				></div>
			</div>
		</div>
	</fieldset>
	
	<!-- Sights, Sounds, and Smells -->
	<fieldset>
		<legend>Sensories</legend>
		<div class="form-group stacked">
			<div class="form-group">
				<label>Sights</label>
				<input type="text" name="system.sensories.sights" v-model="context.system.sensories.sights">
			</div>
			<div class="form-group">
				<label>Sounds</label>
				<input type="text" name="system.sensories.sounds" v-model="context.system.sensories.sounds">
			</div>
			<div class="form-group">
				<label>Smells</label>
				<input type="text" name="system.sensories.smells" v-model="context.system.sensories.smells">
			</div>
		</div>
	</fieldset>
</template>

<script setup>
import { Prosemirror } from '@/components';
const props = defineProps(['context']);
</script>