<template>
	<section class="monster-tables-wrapper form-group stacked ">
		<div class="monster-tables form-group stacked">
			<!-- Wrapper for tables. -->
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
				<!-- Table d6 groups. The crucible table schema is a fixed 6x6 grid:
					six columns (the first d6), each with six rows (the second d6). -->
				<div class="tables-wrapper form-group stacked">
					<fieldset class="tables-wrapper" v-for="(col, colKey) in table.table" :key="colKey">
						<legend>d6 {{ colKey }}</legend>
						<!-- Table rows for 1-6. -->
						<div v-for="(row, rowKey) in col" :key="rowKey" class="form-group">
							<label>{{ rowKey }}</label>
							<input type="text"
								:name="`system.tables.${tableKey}.table.${colKey}.${rowKey}`"
								v-model="context.system.tables[tableKey]['table'][colKey][rowKey]"
							/>
						</div>
					</fieldset>
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
const props = defineProps(["context"]);
</script>
