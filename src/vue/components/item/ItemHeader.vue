<template>
	<header class="sheet-header">
		<img
			class="profile-img"
			:src="context.item.img"
			data-edit="img"
			data-action="onEditImage"
			:title="context.item.name"
			height="100"
			width="100"
		/>
		<div class="header-fields">
			<div class="document-name">
				<input type="text" name="name" v-model="context.item.name" :placeholder="game.i18n.localize('Name')"/>
			</div>
		</div>
	</header>
</template>

<script setup>
import { inject } from 'vue';
const props = defineProps(['context']);
const item = inject('rawDocument');

</script>