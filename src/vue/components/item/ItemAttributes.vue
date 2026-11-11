<template>
	<!-- @TODO: Restore when crucibles are added back to talents. -->
	<!-- <ItemCrucible v-if="['talent'].includes(context.item.type)" :context="context" /> -->
	<TalentTrackers v-if="['arcana', 'talent', 'gear'].includes(context.item.type)" :context="context"/>
	<ChallengeTraitsMoves v-if="context.item.type === 'challenge'" :context="context" />
</template>

<script setup>
import {
	TalentTrackers,
	ChallengeTraitsMoves
} from "@/components";
const props = defineProps(["context"]);
</script>
