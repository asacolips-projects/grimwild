<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<!-- Header -->
		<header class="sheet-header">
			<img
				class="profile-img"
				:src="context.actor.img"
				data-edit="img"
				data-action="onEditImage"
				:title="context.actor.name"
				height="100"
				width="100"
			/>
			<div class="header-fields flexcol">
				<div class="header-details grid grid-6col">
					<div class="form-group stacked grid-span-3">
						<label>{{ game.i18n.localize('Name') }}</label>
						<input type="text" name="name" v-model="context.actor.name"/>
					</div>
					<div class="form-group stacked grid-span-2">
						<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.path.label') }}</label>
						<input type="text" name="system.path" v-model="context.actor.system.path"/>
					</div>
					<div class="form-group stacked grid-span-1">
						<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.xp.short') }}</label>
						<input type="number" name="system.xp" v-model="context.actor.system.xp"/>
					</div>
				</div>

				<div class="stats grid grid-4col">
					<div v-for="(stat, statKey) in actor.system.stats" :key="statKey" class="form-group stacked">
						<label>
							<button type="button" data-action="roll" data-roll-type="stat" :data-stat="statKey">{{stat.label}}</button>
						</label>
						<div class="flexrow">
							<input type="checkbox"
								:name="`system.stats.${statKey}.marked`"
								v-model="context.actor.system.stats[statKey].marked" 
								class="marked"
								:data-tooltip="game.i18n.localize('GRIMWILD.Damage.marked')" 
							/>
							<input type="text"
								:name="`system.stats.${statKey}.value`"
								v-model="context.actor.system.stats[statKey].value"
							/>
						</div>
					</div>
				</div>
				<div class="harm grid grid-2col">
					<div class="form-group">
						<label>{{ game.i18n.localize('GRIMWILD.Damage.bloodied') }}</label>
						<input type="number"
							name="system.bloodied.diceNum"
							v-model="context.actor.system.bloodied.diceNum"
						/>
					</div>
					<div class="form-group">
						<label>{{ game.i18n.localize('GRIMWILD.Damage.rattled') }}</label>
						<input type="number"
							name="system.rattled.diceNum"
							v-model="context.actor.system.rattled.diceNum"
						/>
					</div>
				</div>
			</div>
		</header>

		<div class="section--main">
			<section class="section--fields">
				<!-- Tab links -->
				<Tabs :tabs="tabs.primary" no-span="true"/>
		
				<!-- Details fields -->
				<Tab group="primary" :tab="tabs.primary.details">
					<CharDetails :actor="context.actor" :context="context"/>
				</Tab>
		
				<!-- Attack fields -->
				<Tab v-if="context.actor.type === 'character'" group="primary" :tab="tabs.primary.talents">
					<CharTalents :actor="context.actor" :context="context"/>
				</Tab>

				<!-- Active Effect Fields -->
				<Tab group="primary" :tab="tabs.primary.effects">
					<CharEffects :actor="context.actor" :context="context" :key="context._renderKey"/>
				</Tab>
			</section>
		</div>

	</div>
</template>

<script setup>
import {
	Tabs,
	Tab,
	CharDetails,
	CharTalents,
	CharEffects,
} from '@/components';
import { inject, reactive, toRaw } from 'vue';

const props = defineProps(['context']);
// Convert the tabs into a new reactive variable so that they
// don't change every time the item is updated.
const rawTabs = toRaw(props.context.tabs);
const tabs = reactive({...rawTabs});
// Retrieve a copy of the full item document instance provided by
// the VueApplicationMixin.
const actor = inject('rawDocument');
</script>