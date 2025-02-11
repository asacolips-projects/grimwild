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
						<fieldset class="fieldset-prose-mirror">
							<legend>{{ context.systemFields.biography.label }}</legend>
							<Prosemirror :editable="context.editable" :field="context.editors['system.biography']"/>
						</fieldset>

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
						<!-- Sights, Sounds, and Smells -->
						<fieldset>
							<legend>Sensories</legend>
							<div class="form-group stacked">
								<div class="form-group">
									<label>Sights</label>
									<input type="text" name="system.sensories.sights" v-model="context.system.sensories.sights">
								</div>
								<div class="form-group">
									<label>Sounds</label>
									<input type="text" name="system.sensories.sounds" v-model="context.system.sensories.sounds">
								</div>
								<div class="form-group">
									<label>Smells</label>
									<input type="text" name="system.sensories.smells" v-model="context.system.sensories.smells">
								</div>
							</div>
						</fieldset>
					</Tab>

					<Tab group="primary" :tab="tabs.primary.moves">
						<!-- Traits -->
						<fieldset class="traits-fieldset add-another-entries">
							<legend>{{ context.systemFields.traits.label }}</legend>
							<button class="trait-control entry-create"
								title="Add trait"
								data-action="createArrayEntry"
								data-field="traits"
							><i class="fas fa-plus"></i></button>
							<div class="traits entries form-group stacked">
								<div class="trait entry form-group stacked" v-for="(trait, key) in context.system.traits" :key="key">
									<input type="text"
										:name="`system.traits.${key}`"
										v-model="context.system.traits[key]"
										placeholder="Trait description"/>
									<a class="trait-control entry-delete"
										title="Delete trait"
										data-action="deleteArrayEntry"
										data-field="traits"
										:data-key="key"
									><i class="fas fa-trash"></i></a>
								</div>
							</div>
						</fieldset>

						<!-- Moves -->
						<fieldset class="moves-fieldset add-another-entries">
							<legend>{{ context.systemFields.moves.label }}</legend>
							<button class="move-control entry-create"
								title="Add move"
								data-action="createArrayEntry"
								data-field="moves"
							><i class="fas fa-plus"></i></button>
							<div class="moves entries form-group stacked">
								<div class="move entry form-group stacked" v-for="(move, key) in context.system.moves" :key="key">
									<input type="text"
										:name="`system.moves.${key}`"
										v-model="context.system.moves[key]"
										placeholder="Trait description"/>
									<a class="move-control entry-delete"
										title="Delete move"
										data-action="deleteArrayEntry"
										data-field="moves"
										:data-key="key"
									><i class="fas fa-trash"></i></a>
								</div>
							</div>
						</fieldset>

						<!-- Desires -->
						<fieldset>
							<legend>Desires</legend>
							<div class="form-group stacked">
								<div class="form-group">
									<label>Wants</label>
									<input type="text" name="system.desires.0.value" v-model="context.system.desires[0].value"/>
								</div>
								<div class="form-group">
									<label>Doesn't want</label>
									<input type="text" name="system.desires.1.value" v-model="context.system.desires[1].value"/>
								</div>
							</div>
						</fieldset>
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