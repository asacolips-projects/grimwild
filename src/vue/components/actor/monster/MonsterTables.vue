<template>
	<section class="monster-tables-wrapper form-group stacked ">
		<!-- Use the _arrayEntryKey prop to refresh when the array fields are modified. -->
		<div class="monster-tables form-group stacked" :key="context._arrayEntryKey">
			<!-- Wrapper for ables. -->
			<fieldset class="add-another-entries" v-for="(table, tableKey) in context.system.tables" :key="tableKey">
				<legend>Table</legend>
				<!-- Delete this table. -->
				<button class="legend-control entry-delete"
					title="Delete table"
					data-action="deleteArrayEntry"
					data-field="tables"
					:data-key="tableKey"
				><i class="fas fa-trash"></i></button>
				<!-- Table Name. -->
				<div class="form-group">
					<label>Table name</label>
					<input type="text" 
						:name="`system.tables.${tableKey}.name`" 
						placeholder="Hoarding Instincts"
						v-model="table.name"
					/>
				</div>
				<!-- Table Instructions. -->
				<div class="form-group">
					<label>Table instructions</label>
					<input type="text" 
						:name="`system.tables.${tableKey}.instructions`" 
						placeholder="besides gold"
						v-model="table.instructions"
					/>
				</div>
				<!-- Table d6 groups. -->
				<div class="tables-wrapper form-group stacked">
					<div class="form-group stacked">
						<!-- d6 Table group. -->
						<fieldset class="tables-wrapper add-another-entries" v-for="(col, colKey) in table.table" :key="colKey">
							<legend>d6</legend>
							<!-- Delete this group. -->
							<button class="legend-control entry-delete"
								title="Delete d6 group"
								data-action="deleteArrayEntry"
								:data-field="`system.tables.${tableKey}.table`"
								:data-key="colKey"
							><i class="fas fa-trash"></i></button>
							<!-- Table rows for 1-6. -->
							<div v-for="(row, rowKey) in col" :key="rowKey" class="form-group">
								<label>{{ rowKey + 1 }}</label>
								<input type="text"
									:name="`system.tables.${tableKey}.table.${colKey}.${rowKey}`"
									v-model="context.system.tables[tableKey]['table'][colKey][rowKey]"
								/>
							</div>
						</fieldset>
					</div>
					<!-- Control to add table group. -->
					<button class="table-control entry-create"
						title="Add table group"
						data-action="createArrayEntry"
						:data-field="`system.tables.${tableKey}.table`"
						data-field-type="StringField"
						data-count="6"
					><i class="fas fa-plus"></i>Add d6 table group</button>
				</div>
			</fieldset>
			<!-- Add table -->
			<button class="monster-table-create entry-create"
				title="Add table"
				data-action="createArrayEntry"
				data-field="tables"
			><i class="fas fa-plus"></i>Add table</button>
		</div>
	</section>
</template>

<script setup>
import { inject } from "vue";
// import { RollPoolInput } from "@/components";
const props = defineProps(["context"]);
// const actor = inject("rawDocument");
</script>