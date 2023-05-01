<template>
  <ion-badge>status: {{conferenceStatus}}</ion-badge>
</template>

<script setup lang="ts">
import {
    IonBadge,
} from '@ionic/vue';
import {onMounted, PropType, ref, watch} from "vue";
import {match, P} from "ts-pattern";
import {
    ConferenceStatus,
    conferenceStatusOf, VoxxrinConferenceDescriptor,
} from "@/models/VoxxrinConferenceDescriptor";
import {useInterval} from "@/views/vue-utils";

const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

type DisplayedConferenceStatus = 'unknown'|ConferenceStatus
const conferenceStatus = ref<DisplayedConferenceStatus>('unknown')

onMounted(() => {
    useInterval(refreshStatus, { /* minutes: 15 */ seconds: 4 }, {immediate: true})
})

function refreshStatus() {
    conferenceStatus.value = match(props.event)
        .when(val => val === undefined, () => { return 'unknown'; })
        .otherwise((confDesc) => conferenceStatusOf(confDesc))
}

</script>

<style scoped>
</style>
