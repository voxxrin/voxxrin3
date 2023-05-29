<template>
  <div>
    <talk-format-groups-breakdown
        :event="eventDescriptor" :talks="displayedTalks" :is-highlighted="(talk, talkNotes) => talk.id.isSameThan(selectedTalkId)"
        @talkClicked="updateSelected($event)">
      <template #talk-card-upper-right="{ talk }">
        <div>
          <ion-icon src="/assets/icons/solid/bookmark-favorite.svg" />
          {{ LL.In_favorites() }}
        </div>
      </template>
      <template #talk-card-footer-actions="{ talk, talkNotesHook }">
        <div class="talkActions">
          <div class="talkActions-watchLater">
            <ion-button class="btnTalk watch-later-btn" @click.stop="() => talkNotesHook.toggleWatchLater()" v-if="eventDescriptor.features.remindMeOnceVideosAreAvailableEnabled">
              <ion-icon v-if="!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
              <ion-icon v-if="!!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-button>
          </div>
          <div class="talkActions-feedback">
            <ion-button class="btnTalk feedback-select-btn" @click.stop="() => updateSelected(talk)">
              <ion-icon v-if="talk.id.isSameThan(selectedTalkId)" aria-hidden="true" src="assets/icons/solid/comment-feedback-select.svg"/>
              <ion-icon v-if="!talk.id.isSameThan(selectedTalkId)" aria-hidden="true"  src="assets/icons/line/comment-line.svg"/>
            </ion-button>
          </div>
        </div>
      </template>
    </talk-format-groups-breakdown>
    <ion-button @click="() => showUnfavoritedTalksRef = true" v-if="!showUnfavoritedTalksRef">
      {{LL.Show_non_favorited_talks({ nrOfNonFavoritedTalks: nonFavoritedTalksCount })}} <strong>({{nonFavoritedTalksCount}})</strong>
    </ion-button>
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
  //* Base style slot actions *//
  .talkActions {
    display: flex;
    flex-direction: row;

    &-watchLater, &-highlight { height: 100%;}

    .btnTalk {
      min-height: 55px !important;
      width: 58px !important;
      margin: 0;
      --border-radius: 0;
      --background: rgba(white, 0.5);
      --color: var(--app-primary);
      border-left: 1px solid var(--app-grey-line);
      font-size: 20px;
      --padding-start: 0;
      --padding-end: 0;
      --background-activated-opacity: 0.1;
      --background-hover-opacity: 0.1;
      --box-shadow: none;

      @media (prefers-color-scheme: dark) {
        --background: rgba(white, 0.2);
        --color: var(--app-white);
        border-left: 1px solid var(--app-line-contrast);
      }
    }

    &-actions {
      display: flex;
      align-items: end;
    }
  }
</style>
