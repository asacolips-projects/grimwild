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
			<div v-if="context.actor.type === 'monster'" class="challenge-pool form-group stacked">
				<label>Tough Pool</label>
				<RollPoolInput
					button-action="rollPool"
					field="pool"
					:pool="context.system.pool"
					min="0"
				/>
			</div>
		</section>
	</header>
</template>

<script setup>
import { inject } from "vue";
import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
// const actor = inject("rawDocument");
</script>