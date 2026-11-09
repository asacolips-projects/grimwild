<template>
	<div :class="`grimwild-vue standard-form flexcol`">
		<!-- Palette (MONSTERS ONLY) -->
		<ColorBar v-if="context.actor.type === 'monster'" :colors="context.system.sensories.colors"/>
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
	Prosemirror,
	ColorBar
} from "@/components";
import { useTabs } from "@/composables/useTabs";

const props = defineProps(["context"]);
// Copy the tabs into a local reactive object so that tab state (which tab is
// active) survives context synchronization on re-render.
const tabs = useTabs(props.context);
</script>
