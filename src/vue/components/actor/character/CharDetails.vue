<template>
	<div class="grid grid-2col">
		<!-- Backgrounds -->
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
		<!-- Conditions -->
		<fieldset class="conditions-fieldset grid-span-1 grid-start-2">
			<legend>{{ context.systemFields.conditions.label }}</legend>
			<button class="condition-control condition-create"
				title="Add condition"
				data-action="createArrayEntry"
				data-field="conditions"
			><i class="fas fa-plus"></i></button>
			<div class="conditions form-group stacked">
				<div class="condition form-group stacked" v-for="(condition, key) in context.system.conditions" :key="key">
					<div class="condition-duration">
						<button v-if="condition.severity !== 'permanent'"
							class="condition-roll"
							data-action="rollPool"
							data-field="conditions"
							:data-key="key"
						><i class="fas fa-dice-d6"></i><strong>Roll</strong></button>
						<div v-if="condition.severity !== 'permanent'" class="condition-value-pool flexrow">
							<input type="number"
								class=""
								:name="`system.conditions.${key}.pool.diceNum`"
								v-model="condition.pool.diceNum"
								min="0"
							/><span class="pool-suffix">d</span>
						</div>
						<select :name="`system.conditions.${key}.severity`" v-model="condition.severity">
							<option v-for="(choice, choiceKey) in context.systemFields.conditions.element.fields.severity.choices"
								:key="choiceKey"
								:value="choiceKey"
							>{{ choice }}</option>
						</select>
					</div>
					<input type="text"
						:name="`system.conditions.${key}.name`"
						v-model="condition.name"
						placeholder="Condition name"
					/>
					<a class="condition-control condition-delete"
						title="Delete condition"
						data-action="deleteArrayEntry"
						data-field="conditions"
						:data-key="key"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</fieldset>
		<!-- Bonds -->
		<fieldset class="bonds-fieldset grid-span-1 grid-start-2 grid-row-start-2">
			<legend>{{ context.systemFields.bonds.label }}</legend>
			<button class="bond-control bond-create"
				title="Add bond"
				data-action="createArrayEntry"
				data-field="bonds"
			><i class="fas fa-plus"></i></button>
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
						data-action="deleteArrayEntry"
						data-field="bonds"
						:data-key="key"
					><i class="fas fa-trash"></i></a>
				</div>
			</div>
		</fieldset>
	</div>
</template>

<script setup>
// import {
// 	Prosemirror
// } from '@/components';
const props = defineProps(['actor', 'context']);
</script>