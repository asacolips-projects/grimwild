<template>
	<header class="sheet-header">
		<section class="header-fields grid grid-4col">
			<!-- Avatar -->
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
			<!-- Name -->
			<div class="form-group stacked grid-span-3">
				<div class="form-group">
					<div :class="`name form-group stacked ${context.actor.type === 'monster' ? 'grid-span-2' : 'grid-span-3'}`">
						<label>{{ game.i18n.localize('Name') }}</label>
						<input type="text" name="name" v-model="context.actor.name"/>
					</div>
					<!-- Health Pool -->
					<div v-if="context.actor.type === 'monster' && ['boss', 'elite'].includes(context.system.tier)" class="challenge-pool form-group stacked">
						<label>Challenge Pool</label>
						<RollPoolInput
							button-action="rollPool"
							field="pool"
							:pool="context.system.pool"
							min="0"
						/>
					</div>
				</div>
				<!-- Additional Monster fields -->
				<div v-if="context.actor.type === 'monster'" class="form-group">
					<div class="form-group stacked monster-role">
						<label>Role</label>
						<select name="system.role" v-model="context.system.role">
							<option v-for="(option, key) in roles" :key="key" :value="key">{{ option }}</option>
						</select>
					</div>
					<div class="form-group stacked monster-tier">
						<label>Tier</label>
						<select name="system.tier" v-model="context.system.tier">
							<option v-for="(option, key) in tiers" :key="key" :value="key">{{ option }}</option>
						</select>
					</div>
				</div>
			</div>
		</section>
	</header>
</template>

<script setup>
import { inject } from "vue";
import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
const actor = inject("rawDocument");

const tiers = {
	mook: 'Mook',
	tough: 'Tough',
	elite: 'Elite',
	boss: 'Boss'
};

const roles = {
	blaster: 'Blaster',
	brute: 'Brute',
	lurker: 'Lurker',
	marauder: 'Marauder',
	marksman: 'Marksman',
	overseer: 'Overseer',
	predator: 'Predator',
	protector: 'Protector',
	skirmisher: 'Skirmisher',
	swarmer: 'Swarmer',
	tactician: 'Tactician',
	trickster: 'Trickster',
}
</script>