<template>
  <ion-badge>status: {{conferenceStatus}}</ion-badge>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {
    IonBadge,
} from '@ionic/vue';
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue} from "@/views/vue-utils";
import {useCurrentConferenceDescriptor} from "@/state/CurrentConferenceDescriptor";
import {onMounted, onUnmounted, ref, watch} from "vue";
import {match, P} from "ts-pattern";
import {
    ConferenceStatus,
    conferenceStatusOf,
} from "@/models/VoxxrinConferenceDescriptor";
import {executeAndSetInterval} from "@/models/utils";
import {Temporal} from 'temporal-polyfill'

const route = useRoute();
const eventId = new EventId(getRouteParamsValue(route, 'eventId')!);
const currentConferenceDescriptor = useCurrentConferenceDescriptor(eventId);

type DisplayedConferenceStatus = 'unknown'|ConferenceStatus
const conferenceStatus = ref<DisplayedConferenceStatus>('unknown')
const intervalIds = [];

onMounted(() => {
    intervalIds.push(...[
        executeAndSetInterval(refreshStatus, Temporal.Duration.from({ /* minutes: 15 */ seconds: 4 }))
    ])
})

onUnmounted(() => {
    intervalIds.forEach(clearInterval);
})

function refreshStatus() {
    conferenceStatus.value = match(currentConferenceDescriptor.value)
        .when(val => val === undefined, () => { return 'unknown'; })
        .otherwise((confDesc) => conferenceStatusOf(confDesc))
}

</script>

<style scoped>
</style>
