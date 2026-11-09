<template>
	<!-- Display-only palette bar; entries without a color are skipped. -->
	<div class="color-bar flexrow">
		<template v-for="(color, colorKey) in props.colors" :key="colorKey">
			<div v-if="color.color" class="color-bar-wrapper">
				<div class="color-bar-swatch" :style="`background-color:${color.color}`"></div>
				<div v-if="color.name" class="color-bar-name">{{ color.name }}</div>
			</div>
		</template>
	</div>
</template>

<script setup>
const props = defineProps(["colors"]);
</script>
