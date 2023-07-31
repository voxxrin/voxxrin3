<template>
  <div>
    <talk-format-groups-breakdown :conf-descriptor="confDescriptor" :talks="displayedTalks">
      <template #talk="{ talk }">
        <ion-item class="listTalks-item">
          <schedule-talk :talk="talk" @talkClicked="updateSelected($event)" :is-highlighted="(talk, talkNotes) => talk.id.isSameThan(selectedTalkId)" :conf-descriptor="confDescriptor">
            <template #upper-right="{ talk, talkNotesHook }">
              <talk-is-favorited :talk-notes="talkNotesHook.talkNotes.value" />
            </template>
            <template #footer-actions="{ talk, talkNotesHook }">
              <talk-watch-later-button :user-talk-notes="talkNotesHook" :conf-descriptor="confDescriptor"></talk-watch-later-button>
              <talk-select-for-feedback :is-active="talk.id.isSameThan(selectedTalkId)" @click.stop="() => updateSelected(talk)"></talk-select-for-feedback>
            </template>
          </schedule-talk>
        </ion-item>
      </template>
    </talk-format-groups-breakdown>
    <div class="showTalksContainer" v-if="!showUnfavoritedTalksRef && nonFavoritedTalksCount>0">
      <ion-button fill="outline" shape="round" @click="() => showUnfavoritedTalksRef = true">
        {{LL.Show_non_favorited_talks({ nrOfNonFavoritedTalks: nonFavoritedTalksCount })}} <strong>({{nonFavoritedTalksCount}})</strong>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, Ref, ref, unref} from "vue";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import TalkSelectForFeedback from "@/components/talk-card/TalkSelectForFeedback.vue";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
import TalkIsFavorited from "@/components/talk-card/TalkIsFavorited.vue";

const { LL } = typesafeI18n()

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    talks: {
        required: true,
        type: Object as PropType<Array<VoxxrinTalk>>
    },
    allUserFavoritedTalkIds: {
        required: true,
        type: Object as PropType<TalkId[]>
    },
    selectedTalkId: {
        required: false,
        type: Object as PropType<TalkId|undefined>
    }
})

const emits = defineEmits<{
    (e: 'talk-selected', talk: VoxxrinTalk): void,
    (e: 'talk-deselected', talk: VoxxrinTalk): void,
}>()

function updateSelected(talk: VoxxrinTalk) {
    if(talk.id.isSameThan(props.selectedTalkId)) {
        emits('talk-deselected', talk);
    } else {
        emits('talk-selected', talk);
    }
}

const showUnfavoritedTalksRef = ref<boolean>(false);

const displayedTalks: Ref<VoxxrinTalk[]> = computed(() => {
    const showUnfavoritedTalks = unref(showUnfavoritedTalksRef),
        allUserFavoritedTalkIds = props.allUserFavoritedTalkIds;

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

  .showTalksContainer {
    background-color: var(--app-background);
    padding: var(--app-gutters);
    text-align: center;
  }

  :deep(.listTalks-item) {
    overflow: visible !important;
    --padding-start: 0;
    --inner-padding-end: 0;
    --background: transparent;
    --border-style: none;

    &:last-child {
      margin-bottom: var(--app-gutters);
    }
  }
</style>
