<template>
  <div class="talkAction">
    <ion-button :class="{ 'btnTalk': true, 'btn-favorite': true, '_is-active': !!talkNotes?.isFavorite }"
                @click.stop="() => toggleFavorite(!!talkNotes?.isFavorite)" v-if="confDescriptor?.features.favoritesEnabled"
                :aria-label="talkNotes?.isFavorite ? LL.Remove_Favorites() : LL.Add_Favorites()">
      <span class="btn-favorite-group" :class="{'_animationIn': !!talkNotes?.isFavorite}">
        <ion-icon class="btn-favorite-group-icon" v-if="!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
        <ion-icon class="btn-favorite-group-icon" v-if="!!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
        <ion-label class="btn-favorite-group-nb" v-if="eventTalkStats !== undefined">{{ eventTalkStats.totalFavoritesCount + (localFavorite || 0) }}</ion-label>
      </span>
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, Ref} from "vue";
import {spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useUserTalkNoteActions} from "@/state/useUserTalkNotes";
import {toManagedRef as toRef} from "@/views/vue-utils";
import {TalkId} from "@/models/VoxxrinTalk";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {TalkStats} from "../../../../shared/event-stats";

const { LL } = typesafeI18n()
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
    },
    localFavorite: {
        required: false,
        type: Number as PropType<1 | -1 | undefined>,
        default: undefined
    }
});

const emits = defineEmits<{
    (e: 'talkNoteUpdated', updatedTalkNote: TalkNote): void,
}>()

const talkNotes: Ref<TalkNote|undefined> = toRef(() => props.userTalkNotes);

const eventTalkStats = computed(() => props.talkStats)
const {toggleFavorite} = useUserTalkNoteActions(
    toRef(() => spacedEventIdOf(props.confDescriptor)),
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

    &._animationIn {
      .btn-favorite-group-icon { animation: jello-vertical 800ms both;}
      .btn-favorite-group-nb { animation: pulsate-fwd 400ms ease-in-out both;}
    }

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
