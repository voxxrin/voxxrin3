<template>
  <ion-badge v-bind:class="'_' + conferenceStatus">
    <ion-spinner v-if="conferenceStatus === 'ongoing'" name="dots"></ion-spinner>
    <ion-icon v-if="conferenceStatus === 'past'" aria-hidden="true" :icon="playBackCircle"></ion-icon>
    <ion-icon v-if="conferenceStatus === 'future'" aria-hidden="true" :icon="calendar"></ion-icon>
    {{conferenceStatus}}
  </ion-badge>
</template>

<script setup lang="ts">
import {
    IonIcon,
    IonBadge,
    IonSpinner
} from '@ionic/vue';
import {onMounted, PropType, ref, watch} from "vue";
import {match, P} from "ts-pattern";
import {
    ConferenceStatus,
    conferenceStatusOf, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {useInterval} from "@/views/vue-utils";
import {calendar, playBackCircle} from "ionicons/icons";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";

const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor|ListableVoxxrinEvent>
    }
})

type DisplayedConferenceStatus = 'unknown'|ConferenceStatus
const conferenceStatus = ref<DisplayedConferenceStatus>('unknown')

onMounted(() => {
    useInterval(refreshStatus, import.meta.env.DEV?{seconds:4}:{minutes:15}, {immediate: true})
})

function refreshStatus() {
    conferenceStatus.value = match<VoxxrinConferenceDescriptor|ListableVoxxrinEvent|undefined, DisplayedConferenceStatus>(props.event)
        .with(undefined, () => 'unknown')
        .with(P.any, (event: VoxxrinConferenceDescriptor|ListableVoxxrinEvent) => conferenceStatusOf(event.start, event.end, event.timezone))
        .otherwise(() => 'unknown')
}

</script>

<style scoped lang="scss">
  ion-badge {
    text-transform: capitalize;

    &._past {
      border: none;
      background: rgba(black, 0.2);
    }

    &._future {
      background: var(--app-white);
      color: var(--app-voxxrin);
    }
  }
</style>
