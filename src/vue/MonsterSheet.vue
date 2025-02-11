<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="grimwild-sheet-layout flexcol">
			<MonsterHeader :context="context" />
			
			<div class="section--main flexcol">
				<!-- Tab links -->
				<Tabs :tabs="tabs.primary" no-span="true"/>
				<section class="section--fields flexcol">
					<!-- Biography -->
					<Tab group="primary" :tab="tabs.primary.biography">
						<fieldset>
							<legend>Sensories</legend>
							<!-- Colors -->
							<fieldset>
								<legend>Colors</legend>
								<div class="form-group stacked">
									<div v-for="(color, colorKey) in context.system.sensories.colors"
										:key="colorKey"
										class="form-group"
									>
										<div class="form-group">
											<input type="text" 
												:name="`system.sensories.colors.${colorKey}.name`"
												v-model="color.name"
												placeholder="Name of color"
											/>
										</div>
										<div class="form-group"
											v-html="context.customElements[`system.sensories.colors.${colorKey}.color`].outerHTML"
										></div>
									</div>
								</div>
							</fieldset>
						</fieldset>
						
						<!-- Biography -->
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

					<!-- Challenges fields -->
					<Tab group="primary" :tab="tabs.primary.challenges">
						<MonsterChallenges :context="context"/>
					</Tab>
				</section>
			</div>

		</div>
	</div>
</template>

<script setup>
import {
	Tabs,
	Tab,
	MonsterHeader,
	MonsterChallenges,
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