<template>
	<TalentTrackers :context="context"/>
</template>

<script setup>
import { inject } from 'vue';
import {
	TalentTrackers
} from '@/components';
const props = defineProps(['context']);
const actor = inject('rawDocument');
</script>