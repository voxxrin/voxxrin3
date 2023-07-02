
<template>
  <ion-content :fullscreen="true" v-if="confDescriptor" :style="{
        '--voxxrin-event-theme-colors-primary-hex': confDescriptor.theming.colors.primaryHex,
        '--voxxrin-event-theme-colors-primary-rgb': confDescriptor.theming.colors.primaryRGB,
        '--voxxrin-event-theme-colors-primary-contrast-hex': confDescriptor.theming.colors.primaryContrastHex,
        '--voxxrin-event-theme-colors-primary-contrast-rgb': confDescriptor.theming.colors.primaryContrastRGB,
        '--voxxrin-event-theme-colors-secondary-hex': confDescriptor.theming.colors.secondaryHex,
        '--voxxrin-event-theme-colors-secondary-rgb': confDescriptor.theming.colors.secondaryRGB,
        '--voxxrin-event-theme-colors-secondary-contrast-hex': confDescriptor.theming.colors.secondaryContrastHex,
        '--voxxrin-event-theme-colors-secondary-contrast-rgb': confDescriptor.theming.colors.secondaryContrastRGB,
        '--voxxrin-event-theme-colors-tertiary-hex': confDescriptor.theming.colors.tertiaryHex,
        '--voxxrin-event-theme-colors-tertiary-rgb': confDescriptor.theming.colors.tertiaryRGB,
        '--voxxrin-event-theme-colors-tertiary-contrast-hex': confDescriptor.theming.colors.tertiaryContrastHex,
        '--voxxrin-event-theme-colors-tertiary-contrast-rgb': confDescriptor.theming.colors.tertiaryContrastRGB,
  }">
    <ion-header class="stickyHeader">
      <ion-toolbar>
      <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="$router.back()">
        <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
      </ion-button>
      <ion-title class="stickyHeader-title" slot="start">{{LL.Add_Feedback()}}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-header class="subHeader">
      <div class="subHeader-schedule">
        <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" src="assets/icons/solid/calendar.svg"></ion-icon>
        <ion-label>{{labelledTimeslot.label.date.full}}</ion-label>
      </div>
      <div class="subHeader-timeSlot">
        <ion-icon aria-hidden="true" src="/assets/icons/solid/clock.svg"></ion-icon>
        {{labelledTimeslot.label.full}}
      </div>
    </ion-header>

    <step-header :step="step" :step-label="stepLabel"></step-header>

    <slot></slot>
  </ion-content>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {LabelledTimeslot} from "@/state/findTimeslot";
import StepHeader from "@/components/StepHeader.vue";

const props = defineProps({
    step: {
        required: true,
        type: Number
    },
    stepLabel: {
        required: true,
        type: String
    },
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    labelledTimeslot: {
        required: true,
        type: Object as PropType<LabelledTimeslot>
    }
})

const { LL } = typesafeI18n()

</script>

<style scoped lang="scss">
</style>
