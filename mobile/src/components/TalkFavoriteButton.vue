<template>
  <ion-button :class="{ 'btnTalk': true, 'btn-favorite': true, '_is-active': !!talkNotes?.isFavorite }" @click.stop="() => userTalkNotes.toggleFavorite()" v-if="eventDescriptor?.features.favoritesEnabled">
    <span class="btn-favorite-group">
      <ion-icon class="btn-favorite-group-icon" v-if="!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
      <ion-icon class="btn-favorite-group-icon" v-if="!!talkNotes?.isFavorite" aria-hidden="true" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
      <ion-label class="btn-favorite-group-nb" v-if="eventTalkStats !== undefined">{{ eventTalkStats.totalFavoritesCount }}</ion-label>
    </span>
  </ion-button>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";
import type {UserTalkNotesHook} from "@/state/useUserTalkNotes";
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
const eventTalkStats = computed(() => props.userTalkNotes?.eventTalkStats.value)
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
