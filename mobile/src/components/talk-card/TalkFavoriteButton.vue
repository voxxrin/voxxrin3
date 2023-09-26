<template>
  <div class="talkAction">
    <ion-button :class="{ 'btnTalk': true, 'btn-favorite': true, '_is-active': !!talkNotes?.isFavorite }" @click.stop="() => toggleFavorite()" v-if="confDescriptor?.features.favoritesEnabled">
    <span class="btn-favorite-group">
      <ion-icon class="btn-favorite-group-icon" v-if="!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
      <ion-icon class="btn-favorite-group-icon" v-if="!!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
      <ion-label class="btn-favorite-group-nb" v-if="eventTalkStats !== undefined">{{ eventTalkStats.totalFavoritesCount }}</ion-label>
    </span>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, Ref, toValue} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useUserTalkNoteActions} from "@/state/useUserTalkNotes";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkNote, TalkStats} from "../../../../shared/feedbacks.firestore";

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>,
    },
    talkStats: {
        required: false,
        type: Object as PropType<TalkStats|undefined>
    },
    userTalkNotes: {
        required: true,
        type: Object as PropType<TalkNote>
    }
});

const emits = defineEmits<{
    (e: 'talkNoteUpdated', updatedTalkNote: TalkNote): void,
}>()

const talkNotes: Ref<TalkNote|undefined> = toRef(() => props.userTalkNotes);

const eventTalkStats = computed(() => props.talkStats)
const {toggleFavorite} = useUserTalkNoteActions(
    toRef(() => props.confDescriptor?.id),
    toRef(() => props.userTalkNotes?.talkId ? new TalkId(props.userTalkNotes.talkId) : undefined),
    talkNotes,
    (updatedTalkNote) => emits('talkNoteUpdated', updatedTalkNote)
)
</script>

<style scoped lang="scss">
.btn-favorite {
  --size: 28px;

  &._is-active {
    --background: var(--voxxrin-event-theme-colors-primary-hex);
    --color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    border-left: 1px solid var(--app-primary-shade);
    --border-radius:  0 0 8px 0 !important;
  }

  &-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 2px;

    &-icon {
      position: relative;
      font-size: 26px;
    }

    &-nb {
      font-size: 14px !important;
      font-weight: 700;
    }
  }
}
</style>
