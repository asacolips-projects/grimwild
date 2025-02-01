<template>
	<TalentResources :context="context"/>
</template>

<script setup>
import { inject } from 'vue';
import {
	TalentResources
} from '@/components';
const props = defineProps(['context']);
const actor = inject('rawDocument');
</script>