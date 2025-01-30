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
			<div class="form-group stacked">
				<label>{{ game.i18n.localize('GRIMWILD.Actor.Character.FIELDS.xp.short') }}</label>
				<input type="number" name="system.xp" v-model="context.actor.system.xp"/>
			</div>
		</div>
	</aside>
</template>

<script setup>
const props = defineProps(['context']);
</script>