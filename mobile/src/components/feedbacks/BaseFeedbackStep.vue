
<template>
  <ion-content :fullscreen="true" v-themed-event-styles="confDescriptor">
    <ion-header class="stickyHeader">
      <ion-toolbar>
      <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                  @click="backButtonClicked"
                  :aria-label="LL.Nav_Back()">
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
import StepHeader from "@/components/feedbacks/StepHeader.vue";
import {useIonRouter} from "@ionic/vue";
import {goBackOrNavigateTo} from "@/router";
import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";

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

const spacedEventIdRef = useCurrentSpaceEventIdRef()

const ionRouter = useIonRouter();
function backButtonClicked() {
    goBackOrNavigateTo(ionRouter, `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}`)
}
</script>

<style scoped lang="scss">
</style>
