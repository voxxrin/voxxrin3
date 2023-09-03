<template>
  <ion-badge v-bind:class="'_' + conferenceStatus">
    <ion-spinner v-if="conferenceStatus === 'ongoing'" name="dots"></ion-spinner>
    <ion-icon v-if="conferenceStatus === 'past'" aria-hidden="true" :icon="playBackCircle"></ion-icon>
    <ion-icon v-if="conferenceStatus === 'future'" aria-hidden="true" :icon="calendar"></ion-icon>
    {{conferenceStatusLabels[conferenceStatus]}}
  </ion-badge>
</template>

<script setup lang="ts">
import {
    IonBadge,
    IonSpinner
} from '@ionic/vue';
import {onMounted, PropType, ref} from "vue";
import {match, P} from "ts-pattern";
import {
    ConferenceStatus,
    conferenceStatusOf, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {useInterval} from "@/views/vue-utils";
import {calendar, playBackCircle} from "ionicons/icons";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {typesafeI18n} from "@/i18n/i18n-vue";

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor|ListableVoxxrinEvent>
    }
})

const { LL } = typesafeI18n()

type DisplayedConferenceStatus = 'unknown'|ConferenceStatus
const conferenceStatus = ref<DisplayedConferenceStatus>('unknown')

const conferenceStatusLabels: Record<DisplayedConferenceStatus, string> = {
    future: LL.value.ConfStatus_future(),
    ongoing: LL.value.ConfStatus_ongoing(),
    past: LL.value.ConfStatus_past(),
    unknown: LL.value.ConfStatus_unknown(),
}

onMounted(() => {
    useInterval(refreshStatus, {freq: "low-frequency"}, {immediate: true})
})

function refreshStatus() {
    conferenceStatus.value = match<VoxxrinConferenceDescriptor|ListableVoxxrinEvent|undefined, DisplayedConferenceStatus>(props.confDescriptor)
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
      color: var(--voxxrin-event-theme-colors-secondary-hex);
    }
  }
</style>
