<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<div class="monster-colors flexrow">
			<template v-for="(color, colorKey) in context.system.sensories.colors" :key="colorKey">
				<div v-if="color.color" class="monster-color-wrapper">
					<div class="monster-color" :style="`background-color:${color.color}`"></div>
					<div v-if="color.name" class="monster-color-name">{{ color.name }}</div>
				</div>
			</template>
		</div>
		<div class="grimwild-sheet-layout flexcol">
			<MonsterHeader :context="context" />
			
			<div class="section--main flexcol">
				<!-- Tab links -->
				<Tabs :tabs="tabs.primary" no-span="true"/>
				<section class="section--fields flexcol">
					<!-- Biography -->
					<Tab group="primary" :tab="tabs.primary.biography">
						<MonsterBiography :context="context" />
					</Tab>

					<!-- Traits, Moves, and Desires -->
					<Tab group="primary" :tab="tabs.primary.moves">
						<MonsterTraitsMoves :context="context" />
						<MonsterDesires :context="context" />
					</Tab>

					<!-- Tables -->
					<Tab group="primary" :tab="tabs.primary.tables">
						<MonsterTables :context="context" />
					</Tab>

					<!-- Challenges fields -->
					<Tab group="primary" :tab="tabs.primary.challenges">
						<MonsterChallenges :context="context"/>
					</Tab>

					<!-- Notes fields -->
					<Tab group="primary" :tab="tabs.primary.notes">
						<fieldset class="fieldset-prose-mirror">
							<legend>{{ context.systemFields.notes.label }}</legend>
							<Prosemirror :editable="context.editable" :field="context.editors['system.notes']"/>
						</fieldset>
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
	MonsterBiography,
	MonsterTables,
	MonsterTraitsMoves,
	MonsterDesires,
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