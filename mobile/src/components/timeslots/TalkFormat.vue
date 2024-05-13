<template>
  <div class="talkFormat">
    <ion-icon src="/assets/images/svg/format-symbol.svg" :style="{ 'color': format.themeColor }"></ion-icon>
    <ion-label :style="{ '--color': format.themeColor }">
      {{format.title}} <span v-if="confDescriptor.formattings.talkFormatTitle === 'with-duration'">&nbsp;({{format.hmmDuration}})</span>
    </ion-label>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {VoxxrinTalkFormat} from "@/models/VoxxrinTalkFormat";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
    format: {
        required: true,
        type: Object as PropType<VoxxrinTalkFormat>
    },
    confDescriptor: {
      required: true,
      type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})
</script>

<style lang="scss" scoped>
.talkFormat {
  display: flex;

  ion-icon {
    font-size: 24px;
  }

  ion-label {
    padding-left: 8px;
    font-size: 16px;
    font-weight: 900;
  }
}
</style>
