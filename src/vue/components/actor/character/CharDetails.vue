<template>
	<div class="grid grid-2col">
		<fieldset>
			<legend>{{ context.systemFields.backgrounds.label }}</legend>
			<div class="background flexcol" v-for="(background, key) in context.system.backgrounds" :key="key">
				<div class="background-name form-group stacked">
					<label>{{ game.i18n.localize('Name') }}</label>
					<input type="text"
						:name="`system.backgrounds.${key}.name`"
						v-model="background.name"
						:placeholder="game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.backgrounds.placeholder')"
					/>
				</div>
				<div class="wises form-group stacked">
					<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.backgrounds.FIELDS.wises.label') }}</label>
					<div class="form-group stacked">
						<input type="text"
							:name="`system.backgrounds.${key}.wises.${0}`"
							v-model="background.wises[0]"
						/>
						<input type="text"
							:name="`system.backgrounds.${key}.wises.${1}`"
							v-model="background.wises[1]"
						/>
						<input type="text"
							:name="`system.backgrounds.${key}.wises.${2}`"
							v-model="background.wises[2]"
						/>
					</div>
				</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>{{ context.systemFields.biography.label }}</legend>
			<div class="form-group">
				<div class="field">
					<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
				</div>
			</div>
		</fieldset>
	</div>
</template>

<script setup>
import {
	Prosemirror
} from '@/components';
const props = defineProps(['actor', 'context']);
</script>