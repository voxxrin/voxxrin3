<template>
  <ion-button :class="{ 'btnTalk': true, 'btn-watchLater': true, '_is-active': !!talkNotes?.watchLater }" @click.stop="() => userTalkNotes.toggleWatchLater()" v-if="eventDescriptor?.features.remindMeOnceVideosAreAvailableEnabled">
    <ion-icon v-if="!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
    <ion-icon v-if="!!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {UserTalkNotesHook} from "@/state/useUserTalkNotes";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
    eventDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>,
    },
    userTalkNotes: {
        required: true,
        type: Object as PropType<UserTalkNotesHook>
    }
});

const talkNotes = computed(() => props.userTalkNotes?.talkNotes.value)
</script>

<style scoped lang="scss">
.btn-watchLater {

  &._is-active {
    --background: var(--voxxrin-event-theme-colors-secondary-hex);
    --color: var(--voxxrin-event-theme-colors-secondary-contrast-hex);
    border-left: 1px solid var(--voxxrin-event-theme-colors-secondary-hex);
  }
}
</style>
