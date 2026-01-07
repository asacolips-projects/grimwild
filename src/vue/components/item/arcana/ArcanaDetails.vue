<template>
  <fieldset>
    <legend>{{ game.i18n.localize('GRIMWILD.UI.details') }}</legend>
    <div class="form-group stacked">
      <div class="form-group">
        <label>{{ context.systemFields.tier.label }}</label>
        <select name="system.tier" v-model="context.system.tier">
          <option value="minor">Minor arcana</option>
          <option value="major">Major arcana</option>
          <option value="mythic">Mythic arcana</option>
        </select>
      </div>
      <div class="form-group">
        <label>{{ context.systemFields.touchstones.label }}</label>
        <input type="text" name="system.touchstones" v-model="context.system.touchstones" />
      </div>
      <div class="form-group stacked">
        <label>{{ context.systemFields.limitations.label }}</label>
        <Prosemirror :editable="context.editable" :field="context.editors['system.limitations']"/>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import {
  Prosemirror
} from '@/components';

const props = defineProps(['context']);
</script>