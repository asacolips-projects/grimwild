<template>
	<div class="grid grid-2col">
		<fieldset class="grid-span-1 grid-row-span-2 grid-start-1">
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
		<fieldset class="bonds-fieldset grid-span-1 grid-start-2">
			<legend>{{ context.systemFields.bonds.label }}</legend>
			<a class="bond-control bond-create"
				title="Add bond"
				data-action="createBond"
			><i class="fas fa-plus"></i></a>
			<div class="bonds form-group stacked">
				<div class="bond form-group stacked" v-for="(bond, key) in context.system.bonds" :key="key">
					<input type="text"
						:name="`system.bonds.${key}.name`"
						v-model="bond.name"
						placeholder="Character"/>
					<input type="text"
						:name="`system.bonds.${key}.description`"
						v-model="bond.description"
						placeholder="Bond description"/>
					<a class="bond-control bond-delete"
						title="Delete bond"
						data-action="deleteBond"
						:data-bond="key"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</fieldset>
		<fieldset class="grid-span-1 grid-start-2 grid-row-start-2">
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