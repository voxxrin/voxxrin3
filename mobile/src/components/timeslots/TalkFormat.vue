<template>
  <ion-icon src="/assets/images/svg/format-symbol.svg" :style="{ 'color': format.themeColor }"></ion-icon>
  <ion-label :style="{ '--color': format.themeColor }">
    {{format.title}} ({{format.hmmDuration}})
  </ion-label>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";

const props = defineProps({
    format: {
        required: true,
        type: Object as PropType<VoxxrinTalkFormat>
    }
})
</script>

<style lang="scss" scoped>
ion-icon {
  font-size: 24px;
}

ion-label {
  padding-left: 8px;
  font-size: 16px;
  font-weight: 900;
}
</style>
