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

					<section class="section--fields">
						<!-- Biography / Notes -->
						<Tab group="primary" :tab="tabs.primary.biography">
							<div class="grid grid-2col">
								<fieldset class="grid-span-1">
									<legend>{{ context.systemFields.biography.label }}</legend>
									<div class="form-group">
										<div class="field">
											<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
										</div>
									</div>
								</fieldset>
								<fieldset class="grid-span-1 grid-start-2">
									<legend>{{ context.systemFields.notes.label }}</legend>
									<div class="form-group">
										<div class="field">
											<Prosemirror :editable="context.editable" :field="context.editors['system.notes']"/>
										</div>
									</div>
								</fieldset>
							</div>
						</Tab>

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