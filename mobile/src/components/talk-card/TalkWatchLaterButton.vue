<template>
  <div class="talkAction">
    <ion-button :class="{ 'btnTalk': true, 'btn-watchLater': true, '_is-active': !!talkNotes?.watchLater }" @click.stop="() => toggleWatchLater()" v-if="confDescriptor?.features.remindMeOnceVideosAreAvailableEnabled">
      <ion-icon v-if="!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
      <ion-icon v-if="!!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import {
    useUserTalkNoteActions
} from "@/state/useUserTalkNotes";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {toManagedRef as toRef} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkNote} from "../../../../shared/feedbacks.firestore";

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>,
    },
    userTalkNotes: {
        required: true,
        type: Object as PropType<TalkNote>
    }
});

const {toggleWatchLater} = useUserTalkNoteActions(toRef(() => props.confDescriptor?.id), toRef(() => props.userTalkNotes?.talkId ? new TalkId(props.userTalkNotes?.talkId) : undefined))
const talkNotes = computed(() => props.userTalkNotes)
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
