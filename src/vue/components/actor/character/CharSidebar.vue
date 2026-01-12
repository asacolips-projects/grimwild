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
			<div class="name form-group stacked">
				<label>{{ game.i18n.localize('Name') }}</label>
				<input type="text" name="name" v-model="context.actor.name"/>
			</div>
			<div class="path form-group stacked">
				<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.path.label') }}</label>
				<input type="text" name="system.path" v-model="context.system.path"/>
			</div>
			<!-- Traits -->
			<div class="traits form-group stacked">
				<label>{{ context.systemFields.traits.label }}</label>
				<div class="form-group stacked">
					<div :class="`trait form-group ${trait.are ? 'are' : 'not'}`" v-for="(trait, i) in context.system.traits" :key="i">
						<input type="checkbox" :name="`system.traits.${i}.are`" v-model="trait.are" readonly/>
						<input type="text" :name="`system.traits.${i}.value`" v-model="trait.value" list="traits-list"/>
					</div>
					<datalist id="traits-list">
						<option v-for="(trait, key) in CONFIG.GRIMWILD.traits" :key="key" :value="game.i18n.localize(trait)">{{ game.i18n.localize(trait) }}</option>
					</datalist>
				</div>
			</div>
			<!-- Desires -->
			<div class="desires form-group stacked">
				<label>{{ context.systemFields.desires.label }}</label>
				<div class="form-group stacked">
					<div :class="`desire form-group ${desire.are ? 'are' : 'not'}`" v-for="(desire, i) in context.system.desires" :key="i">
						<input type="checkbox" :name="`system.desires.${i}.are`" v-model="desire.are" readonly/>
						<input type="text" :name="`system.desires.${i}.value`" v-model="desire.value" list="desires-list"/>
					</div>
					<datalist id="desires-list">
						<option v-for="(desire, key) in CONFIG.GRIMWILD.desires" :key="key" :value="game.i18n.localize(desire)">{{ game.i18n.localize(desire) }}</option>
					</datalist>
				</div>
			</div>
			<!-- XP -->
			<div class="xp form-group stacked">
				<div class="xp-lvl grid grid-2col">
					<span class="form-group">
						<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.level.label') }}</label>
						<span>{{ context.system.level }}</span>
					</span>
					<span class="form-group">
						<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.xp.short') }}</label>
						<span>{{ context.system.xp.value }}</span>
					</span>
				</div>
				<div v-for="(level, levelKey) in xpArray" :key="levelKey">
					<template v-for="(xp, xpKey) in level" :key="xpKey">
						<!-- Use checkboxes for semantic handling of the XP. -->
						<input type="checkbox"
							:data-level="levelKey + 1"
							:data-xp="xp"
							data-action="changeXp"
							:checked="isCheckedXp(xp)"
							:class="`xp-checkbox ${getXpClass(xp)}`"
						/>
					</template>
				</div>
			</div>
		</div>
	</aside>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const actor = inject('rawDocument');
const slowXp = game.settings.get('grimwild', 'slowXp');
const xpArray = actor.system.xp.steps.map((xpSteps) => {
	return slowXp
		? xpSteps.map((xp) => xp * 2)
		: xpSteps;
});

function isCheckedXp(xp) {
	let result = false;
	if (actor.system.xp.value >= xp) {
		result = true;
	}
	if (slowXp && actor.system.xp.value == xp - 1) {
		result = true;
	}
	return result;
}

function getXpClass(xp) {
	let result = 'empty';
	if (actor.system.xp.value >= xp) {
		result = 'full';
	}
	if (slowXp && actor.system.xp.value == xp - 1) {
		result = 'half';
	}
	return `xp-${result}`;
}
console.log('xpArray', xpArray);
</script>