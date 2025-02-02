<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="grimwild-sheet-layout flexcol">
			<!-- <CharSidebar :context="context" /> -->
	
			<!-- Header -->
			 <section class="grimwild-main flexcol grid-span-3">
				<ItemHeader :context="context" />

				
				<div class="section--main flexcol">
					<!-- Tab links -->
					<Tabs :tabs="tabs.primary" no-span="true"/>

					<section class="section--fields">
						<!-- Details fields -->
						<Tab group="primary" :tab="tabs.primary.description">
							<!-- Description -->
							<ItemDescription :item="context.item" :context="context"/>
							<!-- Notes -->
							<fieldset v-if="context.item.type === 'talent'">
								<legend>Notes</legend>
								<div class="notes form-group stacked">
									<label>Label</label>
									<input type="text" :name="`system.notes.label`" v-model="context.system.notes.label"/>
								</div>
								<div class="field">
									<Prosemirror :editable="context.editable" :field="context.editors['system.notes.description']"/>
								</div>
							</fieldset>
						</Tab>
				
						<!-- Attack fields -->
						<Tab group="primary" :tab="tabs.primary.attributes">
							<ItemAttributes :context="context" />
						</Tab>
		
						<!-- Active Effect Fields -->
						<Tab group="primary" :tab="tabs.primary.effects">
							Effects
							<!-- <CharEffects :actor="context.actor" :context="context" :key="context._renderKey"/> -->
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
	ItemHeader,
	ItemDescription,
	ItemAttributes,
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
// const item = inject('rawDocument');
</script>