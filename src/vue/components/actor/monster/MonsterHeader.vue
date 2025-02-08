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
			<div class="name form-group stacked grid-span-2">
				<label>{{ game.i18n.localize('Name') }}</label>
				<input type="text" name="name" v-model="context.actor.name"/>
			</div>
			<!-- Health Pool -->
			<div class="challenge-pool form-group stacked">
				<label>Challenge Pool</label>
				<div class="challenge-pool form-group">
					<button class="challenge-pool"
						data-action="rollPool"
						data-field="pool"
					><i class="fas fa-dice-d6"></i><strong>Roll</strong></button>
					<input type="number"
						class=""
						:name="`system.pool.diceNum`"
						v-model="context.system.pool.diceNum"
						min="0"
					/>
					<span class="pool-suffix">d</span>
				</div>
			</div>
		</section>
	</header>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const actor = inject('rawDocument');
</script>