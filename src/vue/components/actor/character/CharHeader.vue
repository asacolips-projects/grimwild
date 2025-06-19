<template>
	<header class="sheet-header stroke stroke-bottom flexrow">
		<div class="header-fields flexcol">
			<!-- Stats / Marks -->
			<div class="stats grid grid-2col">
				<div v-for="(statGroup, statGroupKey) in [['bra', 'agi'], ['wit', 'pre']]" :key="statGroupKey"
					:class="`${statGroupKey === 0 ? 'stats-physical' : 'stats-mental'} form-group stacked`"
				>
					<div class="stats-group form-group">
						<div v-for="(stat, statKey) in statGroup" :key="statKey" :class="`stat stat-${stat} form-group stacked`">
							<label>
								<button type="button"
									data-action="roll"
									data-roll-type="stat"
									:data-stat="stat"
								><i class="fas fa-dice-d6"></i> {{actor.system.stats[stat].label}}</button>
							</label>
							<div class="flexrow">
								<input type="checkbox"
									:name="`system.stats.${stat}.marked`"
									v-model="context.system.stats[stat].marked"
									class="marked"
									:data-tooltip="game.i18n.localize('GRIMWILD.Damage.marked')"
								/>
								<input type="number"
									:name="`system.stats.${stat}.value`"
									v-model="context.system.stats[stat].value"
									:min="context.systemFields.stats.fields[stat].fields.value.min"
									:max="context.systemFields.stats.fields[stat].fields.value.max"
								/>
							</div>
						</div>
					</div>

					<div v-if="statGroupKey === 0" class="harm harm-bloodied form-group">
						<!-- <div class="flexcol">
							<label>
								<input type="checkbox" name="system.bloodied.marked" v-model="context.system.bloodied.marked"/>
								{{ game.i18n.localize('GRIMWILD.Damage.bloodied') }}
							</label>
							<label>
								<input type="checkbox" name="system.bloodied.dropped" v-model="context.system.bloodied.dropped"/>
								{{ game.i18n.localize('GRIMWILD.Damage.dropped') }}
							</label>
						</div> -->

					</div>
					<div v-if="statGroupKey === 1" class="harm harm-rattled form-group">
						<!-- <div class="flexcol">
							<label>
								<input type="checkbox" name="system.rattled.marked" v-model="context.system.rattled.marked"/>
								{{ game.i18n.localize('GRIMWILD.Damage.rattled') }}
							</label>
							<label>
								<input type="checkbox" name="system.rattled.dropped" v-model="context.system.rattled.dropped"/>
								{{ game.i18n.localize('GRIMWILD.Damage.dropped') }}
							</label>
						</div> -->

					</div>
				</div>
			</div>

			<div class="stats-harm harm-group form-group">
				<!-- Bloodied -->
				<div class="harm harm-bloodied">
					<label>
						<input type="checkbox" name="system.bloodied.marked" v-model="context.system.bloodied.marked"/>
						{{ game.i18n.localize('GRIMWILD.Damage.bloodied') }}
					</label>
					<!-- Optional, homebrew -->
					<RollPoolInput
						v-if="context?.enableHarm"
						button-action="rollPool"
						field="bloodied"
						field-name="system.bloodied.pool.diceNum"
						:pool="context.system.bloodied.pool"
						min="0"
						:max="context?.maxBloodied"
						:suffix="context?.maxBloodied ? `/ ${context.maxBloodied}` : 'd'"
					/>
				</div>
				<!-- Rattled -->
				<div class="harm harm-rattled">
					<label>
						<input type="checkbox" name="system.rattled.marked" v-model="context.system.rattled.marked"/>
						{{ game.i18n.localize('GRIMWILD.Damage.rattled') }}
					</label>
					<!-- Optional, homebrew -->
					<RollPoolInput
						v-if="context?.enableHarm"
						button-action="rollPool"
						field="rattled"
						field-name="system.rattled.pool.diceNum"
						:pool="context.system.rattled.pool"
						min="0"
						:max="context?.maxRattled"
						:suffix="context?.maxRattled ? `/ ${context.maxRattled}` : 'd'"
					/>
				</div>
				<!-- Dropped -->
				<div class="harm harm-dropped">
					<label>
						<input type="checkbox" name="system.bloodied.dropped" v-model="context.system.bloodied.dropped"/>
						{{ game.i18n.localize('GRIMWILD.Damage.dropped') }}
					</label>
				</div>
			</div>
		</div>
		<!-- Spark / Story -->
		<div class="metacurrency-fields flexcol">
			<div class="spark form-group stacked">
				<label><i class="fas fa-bolt"></i> {{ context.systemFields.spark.label }}</label>
				<div class="form-inputs">
					<input type="checkbox"
						name="system.spark.steps.0"
						v-model="context.system.spark.steps[0]"
					/>
					<input type="checkbox"
						name="system.spark.steps.1"
						v-model="context.system.spark.steps[1]"
					/>
				</div>
			</div>
			<div class="story form-group stacked">
				<label><i class="fas fa-book"></i> {{ context.systemFields.story.label }}</label>
				<div class="form-inputs">
					<input type="checkbox"
						name="system.story.steps.0"
						v-model="context.system.story.steps[0]"
					/>
					<input type="checkbox"
						name="system.story.steps.1"
						v-model="context.system.story.steps[1]"
					/>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
import { inject } from "vue";
import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
const actor = inject("rawDocument");
</script>