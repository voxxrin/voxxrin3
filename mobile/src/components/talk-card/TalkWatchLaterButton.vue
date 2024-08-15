<template>
  <div class="talkAction">
    <!-- TODO Fix dynamic aria-label -->
    <ion-button :class="{ 'btnTalk': true, 'btn-watchLater': true, '_is-active': !!talkNotes?.watchLater }" @click.stop="() => toggleWatchLater()"
                v-if="confDescriptor?.features.remindMeOnceVideosAreAvailableEnabled"
                :aria-label="talkNotes?.watchLater ? LL.Remove_Watch_later() : LL.Add_Watch_later()">
      <ion-icon v-if="!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
      <ion-icon v-if="!!talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {useUserTalkNoteActions} from "@/state/useUserTalkNotes";
import {spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {toManagedRef as toRef} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()
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

const emits = defineEmits<{
    (e: 'talkNoteUpdated', updatedTalkNote: TalkNote): void,
}>()

const talkNotes = toRef(() => props.userTalkNotes)

const {toggleWatchLater} = useUserTalkNoteActions(
    toRef(() => spacedEventIdOf(props.confDescriptor)),
    toRef(() => props.userTalkNotes?.talkId ? new TalkId(props.userTalkNotes?.talkId) : undefined),
    talkNotes,
    updatedTalkNote => emits("talkNoteUpdated", updatedTalkNote)
)

defineExpose({
    toggleWatchLater
})
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
