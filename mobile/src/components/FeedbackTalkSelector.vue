<template>
  <div>
    <talk-format-groups-breakdown
        :event="eventDescriptor" :talks="displayedTalks" :is-highlighted="(talk, talkNotes) => talk.id.isSameThan(selectedTalkId)"
        @talkClicked="updateSelected($event)">
      <template #talk-card-upper-right="{ talk }">
        <div class="talkFavorite">
          <ion-icon src="/assets/icons/solid/bookmark-favorite.svg" />
          {{ LL.In_favorites() }}
        </div>
      </template>
      <template #talk-card-footer-actions="{ talk, talkNotesHook }">
        <div class="talkActions">
          <div class="talkActions-watchLater">
            <ion-button class="btnTalk btn-watchLater" @click.stop="() => talkNotesHook.toggleWatchLater()" v-if="eventDescriptor.features.remindMeOnceVideosAreAvailableEnabled">
              <ion-icon v-if="!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
              <ion-icon v-if="!!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-button>
          </div>
          <div class="talkActions-feedback">
            <ion-button class="btnTalk btn-feedbackSelect" @click.stop="() => updateSelected(talk)">
              <ion-icon v-if="talk.id.isSameThan(selectedTalkId)" aria-hidden="true" src="assets/icons/solid/comment-feedback-select.svg"/>
              <ion-icon v-if="!talk.id.isSameThan(selectedTalkId)" aria-hidden="true"  src="assets/icons/line/comment-line.svg"/>
            </ion-button>
          </div>
        </div>
      </template>
    </talk-format-groups-breakdown>
    <div class="showTalksContainer" v-if="!showUnfavoritedTalksRef">
      <ion-button fill="outline" @click="() => showUnfavoritedTalksRef = true">
        {{LL.Show_non_favorited_talks({ nrOfNonFavoritedTalks: nonFavoritedTalksCount })}} <strong>({{nonFavoritedTalksCount}})</strong>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, Prop, PropType, Ref, ref, unref} from "vue";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useUserEventAllFavoritedTalkIds} from "@/state/useUserTalkNotes";

const { LL } = typesafeI18n()

const props = defineProps({
    eventDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    talks: {
        required: true,
        type: Object as PropType<Array<VoxxrinTalk>>
    },
    selectedTalkId: {
        required: false,
        type: Object as PropType<TalkId>
    }
})

defineEmits<{
    (e: 'talk-selected', talk: VoxxrinTalk): void,
    (e: 'talk-deselected', talk: VoxxrinTalk): void,
}>()

const selectedTalkId = ref<TalkId|undefined>(undefined);

function updateSelected(talk: VoxxrinTalk) {
    if(talk.id.isSameThan(selectedTalkId.value)) {
        selectedTalkId.value = undefined;
    } else {
        selectedTalkId.value = talk.id;
    }
}

const { allUserFavoritedTalkIds: allUserFavoritedTalkIdsRef } = useUserEventAllFavoritedTalkIds(props.eventDescriptor?.id)

const showUnfavoritedTalksRef = ref<boolean>(false);

const displayedTalks: Ref<VoxxrinTalk[]> = computed(() => {
    const showUnfavoritedTalks = unref(showUnfavoritedTalksRef),
        allUserFavoritedTalkIds = unref(allUserFavoritedTalkIdsRef);

    if(!props.talks) {
        return []
    }

    return props.talks.filter(talk => showUnfavoritedTalks || talk.id.isIncludedIntoArray(allUserFavoritedTalkIds));
})

const nonFavoritedTalksCount = computed(() => {
    if(!props.talks) {
        return 0;
    }

    return props.talks.length - displayedTalks.value.length;
})

</script>

<style lang="scss" scoped>

  .talkFavorite {
    display: flex;
    justify-content: center;
    column-gap: 4px;
    color: var(--voxxrin-event-theme-colors-primary-hex);
    font-weight: bold;

    ion-icon { font-size: 18px;}
  }

  //* Base style slot actions *//
  .talkActions {
    display: flex;
    flex-direction: row;

    &-watchLater, &-highlight { height: 100%;}

    &-actions {
      display: flex;
      align-items: end;
    }
  }

  .showTalksContainer {
    background-color: var(--app-background);
    padding: var(--app-gutters);
    text-align: center;
  }
</style>
