<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<!-- Colors (MONSTERS ONLY) -->
		<div v-if="context.actor.type === 'monster'" class="monster-colors flexrow">
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
					<!-- Biography (MONSTERS ONLY) -->
					<Tab v-if="context.actor.type === 'monster'" group="primary" :tab="tabs.primary.biography">
						<MonsterBiography :context="context" />
					</Tab>

					<!-- Traits, Moves, and Desires -->
					<Tab group="primary" :tab="tabs.primary.moves">
						<MonsterTraitsMoves :context="context" />
						<!-- Desires (MONSTERS ONLY) -->
						<MonsterDesires v-if="context.actor.type === 'monster'" :context="context" />
					</Tab>

					<!-- Tables (MONSTERS ONLY) -->
					<Tab v-if="context.actor.type === 'monster'" group="primary" :tab="tabs.primary.tables">
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
} from "@/components";
import { useTabs } from "@/composables/useTabs";

const props = defineProps(["context"]);
// Copy the tabs into a local reactive object so that tab state (which tab is
// active) survives context synchronization on re-render.
const tabs = useTabs(props.context);
</script>
