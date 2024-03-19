<template>
  <div>
    <talk-format-groups-breakdown :conf-descriptor="confDescriptor" :talks="displayedTalks">
      <template #talk="{ talk }">
        <ion-item class="listTalks-item">
          <schedule-talk :talk="talk" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)" :talk-notes="userTalkNotesRefByTalkIdRef.get(talk.id.value)"
                         :is-highlighted="(talk, talkNotes) => talk.id.isSameThan(selectedTalkId)" :conf-descriptor="confDescriptor"
                         @talkClicked="updateSelected($event)" >
            <template #upper-right="{ talk, talkNotes }">
              <talk-is-favorited :talk-notes="talkNotes" />
            </template>
            <template #footer-actions="{ talk, talkNotes, talkStats }">
              <talk-watch-later-button :user-talk-notes="talkNotes" :conf-descriptor="confDescriptor"
                   @talk-note-updated="updatedTalkNote => userTalkNotesRefByTalkIdRef.set(talk.id.value, updatedTalkNote)"
                   :ref="talkWatchLaterBtn => updateTalkWatchLaterRefTo(talk.id, talkWatchLaterBtn)"/>
              <talk-select-for-feedback :is-active="talk.id.isSameThan(selectedTalkId)" @click.stop="() => updateSelected(talk)"></talk-select-for-feedback>
            </template>
          </schedule-talk>
        </ion-item>
      </template>
    </talk-format-groups-breakdown>
    <div class="showTalksContainer" v-if="!showUnfavoritedTalksRef && nonFavoritedTalksCount>0">
      <ion-button fill="outline" shape="round" @click="() => showUnfavoritedTalksRef = true"
      :aria-label="LL.Show_non_favorited_talks()">
        {{LL.Show_non_favorited_talks({ nrOfNonFavoritedTalks: nonFavoritedTalksCount })}}
        <strong>({{nonFavoritedTalksCount}})</strong>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, Ref, toValue} from "vue";
import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import TalkFormatGroupsBreakdown from "@/components/schedule/TalkFormatGroupsBreakdown.vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {typesafeI18n} from "@/i18n/i18n-vue";
import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";
import TalkSelectForFeedback from "@/components/talk-card/TalkSelectForFeedback.vue";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import TalkIsFavorited from "@/components/talk-card/TalkIsFavorited.vue";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import {useUserEventTalkNotes, useUserTalkNoteActions} from "@/state/useUserTalkNotes";
import {match} from "ts-pattern";
import {TalkNote} from "../../../../shared/feedbacks.firestore";

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

const eventId = toRef(() => props.confDescriptor?.id);
const talkIdsRef = toRef(() => props.talks?.map(talk => talk.id));

const {firestoreEventTalkStatsRef: talkStatsRefByTalkId} = useEventTalkStats(eventId, talkIdsRef)
const {userEventTalkNotesRef: userTalkNotesRefByTalkIdRef} = useUserEventTalkNotes(eventId, talkIdsRef)

function updateSelected(talk: VoxxrinTalk) {
    if(talk.id.isSameThan(props.selectedTalkId)) {
        emits('talk-deselected', talk);
    } else {
        emits('talk-selected', talk);
    }
}

const showUnfavoritedTalksRef = ref<boolean>(false);

const displayedTalks: Ref<VoxxrinTalk[]> = computed(() => {
    const showUnfavoritedTalks = toValue(showUnfavoritedTalksRef),
        allUserFavoritedTalkIds = toValue(props.allUserFavoritedTalkIds);

    if(!props.talks || !allUserFavoritedTalkIds) {
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

const talkWatchLaterButtonPerTalkIdRef = ref(new Map<string, InstanceType<typeof TalkWatchLaterButton>>())

defineExpose({
    watchLaterAllFavoritedTalks: () => {
        const talks = toValue(props.talks) as VoxxrinTalk[],
            allUserFavoritedTalkIds = toValue(props.allUserFavoritedTalkIds) as TalkId[],
            selectedTalkId = toValue(props.selectedTalkId),
            userTalkNotesRefByTalkId = toValue(userTalkNotesRefByTalkIdRef);

        talks.forEach(talk => {
            if(!talk.id.isIncludedIntoArray(allUserFavoritedTalkIds)) {
                return;
            }

            const favoritedTalkId = talk.id;
            const talkNotes: TalkNote|undefined = userTalkNotesRefByTalkId.get(favoritedTalkId.value);
            const watchLaterButton = talkWatchLaterButtonPerTalkIdRef.value.get(favoritedTalkId.value);
            if(!watchLaterButton) {
                return;
            }

            if(favoritedTalkId.isSameThan(selectedTalkId) && !!talkNotes?.watchLater) {
                // We want to disable watch on selected talk
                watchLaterButton.toggleWatchLater();
            } else if(!favoritedTalkId.isSameThan(selectedTalkId) && !talkNotes?.watchLater) {
                // We want to enable watch on non-selected talk which are not marked as watch (yet)
                watchLaterButton.toggleWatchLater();
            } else {
                // no op
            }
        })
    }
})

function updateTalkWatchLaterRefTo(talkId: TalkId, talkWatchLaterBtn: any) {
    talkWatchLaterButtonPerTalkIdRef.value.set(talkId.value, talkWatchLaterBtn)
}
</script>

<style lang="scss" scoped>

  .showTalksContainer {
    background-color: var(--app-background);
    padding: var(--app-gutters);
    text-align: center;

    strong {
      margin-left: 4px;
    }
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
