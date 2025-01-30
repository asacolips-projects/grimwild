<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="grid grid-4col">
			<CharSidebar :context="context" />
	
			<!-- Header -->
			 <section class="grimwild-main grid-span-3">
				<CharHeader :context="context" />
				
				<div class="section--main">
					<section class="section--fields">
						<!-- Tab links -->
						<Tabs :tabs="tabs.primary" no-span="true"/>
				
						<!-- Details fields -->
						<Tab group="primary" :tab="tabs.primary.details">
							<CharDetails :actor="context.actor" :context="context"/>
						</Tab>
				
						<!-- Attack fields -->
						<Tab v-if="context.actor.type === 'character'" group="primary" :tab="tabs.primary.talents">
							<CharTalents :actor="context.actor" :context="context"/>
						</Tab>
		
						<!-- Active Effect Fields -->
						<Tab group="primary" :tab="tabs.primary.effects">
							<CharEffects :actor="context.actor" :context="context" :key="context._renderKey"/>
						</Tab>
					</section>
				</div>
			 </section>
		</div>

	</div>
</template>

<script setup>
import {
	Tabs,
	Tab,
	CharSidebar,
	CharHeader,
	CharDetails,
	CharTalents,
	CharEffects,
} from '@/components';
import { reactive, toRaw } from 'vue';

const props = defineProps(['context']);
// Convert the tabs into a new reactive variable so that they
// don't change every time the item is updated.
const rawTabs = toRaw(props.context.tabs);
const tabs = reactive({...rawTabs});
// Retrieve a copy of the full item document instance provided by
// the VueApplicationMixin.
// const actor = inject('rawDocument');
</script>