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
			<!-- Spark / Story -->
			<div class="spark form-group">
				<label>{{ context.systemFields.spark.label }}</label>
				<div class="form-inputs">
					<input type="checkbox"
						name="system.spark.steps.0"
						v-model="context.actor.system.spark.steps[0]"
					/>
					<input type="checkbox"
						name="system.spark.steps.1"
						v-model="context.actor.system.spark.steps[1]"
					/>
				</div>
			</div>
			<div class="story form-group">
				<label>{{ context.systemFields.story.label }}</label>
				<div class="form-inputs">
					<input type="checkbox"
						name="system.story.steps.0"
						v-model="context.actor.system.story.steps[0]"
					/>
					<input type="checkbox"
						name="system.story.steps.1"
						v-model="context.actor.system.story.steps[1]"
					/>
				</div>
			</div>
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('Name') }}</label>
				<input type="text" name="name" v-model="context.actor.name"/>
			</div>
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.path.label') }}</label>
				<input type="text" name="system.path" v-model="context.actor.system.path"/>
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