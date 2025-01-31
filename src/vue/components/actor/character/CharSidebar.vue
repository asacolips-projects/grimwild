<template>
	<aside class="grimwild-sidebar grid-span-1">
		<div class="grimwild-avatar">
			<img
				class="profile-img"
				:src="context.actor.img"
				data-edit="img"
				data-action="onEditImage"
				:title="context.actor.name"
				height="100"
				width="100"
			/>
		</div>
		<div class="sidebar-details flexcol">
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('Name') }}</label>
				<input type="text" name="name" v-model="context.actor.name"/>
			</div>
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.path.label') }}</label>
				<input type="text" name="system.path" v-model="context.actor.system.path"/>
			</div>
			<div class="traits form-group stacked">
				<label>{{ context.systemFields.traits.label }}</label>
				<div class="form-group stacked">
					<div class="trait form-group" v-for="(trait, i) in context.system.traits" :key="i">
						<input type="checkbox" :name="`system.traits.${i}.are`" v-model="trait.are"/>
						<input type="text" :name="`system.traits.${i}.value`" v-model="trait.value" list="traits-list"/>
					</div>
					<datalist id="traits-list">
						<option v-for="(trait, key) in CONFIG.GRIMWILD.traits" :key="key" :value="game.i18n.localize(trait)">{{ game.i18n.localize(trait) }}</option>
					</datalist>
				</div>
			</div>
			<div class="desires form-group stacked">
				<label>{{ context.systemFields.desires.label }}</label>
				<div class="form-group stacked">
					<div class="desire form-group" v-for="(desire, i) in context.system.desires" :key="i">
						<input type="checkbox" :name="`system.desires.${i}.are`" v-model="desire.are"/>
						<input type="text" :name="`system.desires.${i}.value`" v-model="desire.value" list="desires-list"/>
					</div>
					<datalist id="desires-list">
						<option v-for="(desire, key) in CONFIG.GRIMWILD.desires" :key="key" :value="game.i18n.localize(desire)">{{ game.i18n.localize(desire) }}</option>
					</datalist>
				</div>
			</div>
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.xp.short') }}</label>
				<input type="number" name="system.xp" v-model="context.actor.system.xp"/>
			</div>
		</div>
	</aside>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const actor = inject('rawDocument');
</script>