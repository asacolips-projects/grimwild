<template>
	<!-- @TODO: Restore when crucibles are added back to talents. -->
	<!-- <ItemCrucible v-if="['talent'].includes(context.item.type)" :context="context" /> -->
	<TalentTrackers v-if="['arcana', 'talent'].includes(context.item.type)" :context="context"/>
	<ChallengeTraitsMoves v-if="context.item.type === 'challenge'" :context="context" />
</template>

<script setup>
import { inject } from 'vue';
import {
	TalentTrackers,
	ChallengeTraitsMoves,
	ItemCrucible,
} from '@/components';
const props = defineProps(['context']);
const actor = inject('rawDocument');
</script>