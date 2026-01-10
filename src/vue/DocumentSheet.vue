<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="grimwild-sheet-layout grid grid-4col">
			<CharSidebar :context="context" />

			<!-- Header -->
			 <section class="grimwild-main flexcol grid-span-3">
				<CharHeader :context="context" />

				<div class="section--main flexcol">
					<!-- Tab links -->
					<Tabs :tabs="tabs.primary" no-span="true"/>

					<section class="section--fields flexcol">
						<!-- Biography / Notes -->
						<Tab group="primary" :tab="tabs.primary.biography">
							<fieldset class="fieldset-prose-mirror">
								<legend>{{ context.systemFields.biography.label }}</legend>
								<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
							</fieldset>
						</Tab>

						<!-- Notes fields -->
						<Tab group="primary" :tab="tabs.primary.notes">
							<fieldset class="fieldset-prose-mirror">
								<legend>{{ context.systemFields.notes.label }}</legend>
								<Prosemirror :editable="context.editable" :field="context.editors['system.notes']"/>
							</fieldset>
						</Tab>

						<!-- Details fields -->
						<Tab group="primary" :tab="tabs.primary.details">
							<CharDetails :actor="context.actor" :context="context"/>
						</Tab>

						<!-- Attack fields -->
						<Tab v-if="context.actor.type === 'character'" group="primary" :tab="tabs.primary.talents">
							<CharTalents :actor="context.actor" :context="context"/>
						</Tab>

						<!-- Arcana -->
						<Tab v-if="context.actor.type === 'character'" group="primary" :tab="tabs.primary.arcana">
							<CharArcana :actor="context.actor" :context="context"/>
						</Tab>

						<!-- @todo Active effects disabled for now. -->
						<!-- Active Effect Fields -->
						<!-- <Tab group="primary" :tab="tabs.primary.effects">
							<CharEffects :actor="context.actor" :context="context" :key="context._renderKey"/>
						</Tab> -->
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
	CharArcana,
	CharEffects,
	Prosemirror
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