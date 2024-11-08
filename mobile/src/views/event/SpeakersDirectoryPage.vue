<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptor">
      <current-event-header :conf-descriptor="confDescriptor" />
      <toolbar-header :title="LL.Speakers()" :modes="[...MODES]" :search-enabled="true"
                      @search-terms-updated="searchTerms => searchTermsRef = searchTerms"
                      @mode-updated="(updatedModeId, previousModeId) => currentMode = updatedModeId as typeof currentMode">
      </toolbar-header>

      <speaker-card v-for="speaker in speakers" @speaker-clicked="openSpeakerDetails($event)" :confDescriptor="confDescriptor" :speaker="speaker" :key="speaker.id.value">
        <template #content="{}">
          <ion-list class="talkResumeList" :style="{ display: currentMode === 'detailed' ? 'block':'none' }">
            <schedule-talk v-for="talk in speaker.talks" :key="talk.id.value"
                           :talk="{ ...talk, speakers: [speaker, ...talk.otherSpeakers] }" :room-id="talk.allocation?.room.id" :talk-stats="talkStatsRefByTalkId.get(talk.id.value)"
                           :talk-notes="userEventTalkNotesRef.get(talk.id.value)"
                           @talk-clicked="(clickedTalk) => $emit('talk-clicked', clickedTalk)"
                           :is-highlighted="(talk, talkNotes) => talkNotes.isFavorite" :conf-descriptor="confDescriptor">
              <template #upper-right>
                <talk-room v-if="talk.allocation" :room="talk.allocation.room" :conf-descriptor="confDescriptor" />
              </template>
              <template #footer-actions="{ talkStats, talkNotes }">
                <talk-watch-later-button v-if="confDescriptor"
                                         :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes"
                                         @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
                <talk-favorite-button scope="schedule-talk" v-if="confDescriptor"
                                      :conf-descriptor="confDescriptor" :user-talk-notes="talkNotes" :talk-stats="talkStats"
                                      :local-favorite="localEventTalkNotesRef.get(talk.id.value)"
                                      @talk-note-updated="updatedTalkNote => userEventTalkNotesRef.set(talk.id.value, updatedTalkNote) " />
              </template>
            </schedule-talk>
          </ion-list>
        </template>
      </speaker-card>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button class="btnGoToTicketing" :aria-label="LL.Go_To_Ticketing()">
          <ion-icon :icon="ticket" aria-hidden="true"></ion-icon>
        </ion-fab-button>
      </ion-fab>
      <PoweredVoxxrin></PoweredVoxxrin>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {managedRef as ref, toManagedRef as toRef} from "@/views/vue-utils";
  import {IonFab, IonFabButton} from "@ionic/vue";
  import {albums, list, ticket} from "ionicons/icons";
  import PoweredVoxxrin from "@/components/ui/PoweredVoxxrin.vue";
  import SpeakerCard from "@/components/speaker-card/SpeakerCard.vue";
  import {useTabbedPageNav} from "@/state/useTabbedPageNav";
  import {VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";
  import ToolbarHeader from "@/components/ui/ToolbarHeader.vue";
  import {getResolvedEventRootPathFromSpacedEventIdRef, useCurrentSpaceEventIdRef} from "@/services/Spaces";
  import {useLineupSpeakers} from "@/state/useEventSpeakers";
  import {useLocalEventTalkFavsStorage, useUserEventTalkNotes} from "@/state/useUserTalkNotes";
  import {computed, toValue} from "vue";
  import {TalkId} from "@/models/VoxxrinTalk";
  import {useEventTalkStats} from "@/state/useEventTalkStats";
  import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
  import TalkRoom from "@/components/talk-card/TalkRoom.vue";
  import TalkFavoriteButton from "@/components/talk-card/TalkFavoriteButton.vue";
  import TalkWatchLaterButton from "@/components/talk-card/TalkWatchLaterButton.vue";

  const { LL } = typesafeI18n()
  const spacedEventIdRef = useCurrentSpaceEventIdRef();
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(spacedEventIdRef);
  const { triggerTabbedPageNavigate } = useTabbedPageNav();

  const searchTermsRef = ref<string|undefined>(undefined);
  const { speakers } = useLineupSpeakers(confDescriptor, searchTermsRef)

  const localEventTalkNotesRef = useLocalEventTalkFavsStorage(spacedEventIdRef)
  const talkIdsRef = computed(() => {
    const unreffedSpeakers = toValue(speakers);
    if(!unreffedSpeakers) {
      return [];
    }

    const uniqueRawTalkIds = unreffedSpeakers.reduce((rawTalkIds, speaker) => {
      speaker.talks.forEach(talk => rawTalkIds.add(talk.id.value));
      return rawTalkIds;
    }, new Set<string>())

    return [...uniqueRawTalkIds].map(rawTalkId => new TalkId(rawTalkId));
  })
  const {userEventTalkNotesRef} = useUserEventTalkNotes(spacedEventIdRef, talkIdsRef)
  const {firestoreEventTalkStatsRef: talkStatsRefByTalkId} = useEventTalkStats(spacedEventIdRef, talkIdsRef)

  const DEFAULT_MODE = 'compact';
  const currentMode = ref<typeof MODES[number]['id']>(DEFAULT_MODE);
  const MODES = [
    { id: "compact", icon: list, label: LL.value.Compact_list_mode(), preSelected: true },
    { id: "detailed", icon: albums, label: LL.value.Big_list_mode(), preSelected: false },
  ] as const

  async function openSpeakerDetails(speaker: VoxxrinSimpleSpeaker) {
    if(speaker) {
      const url = `${getResolvedEventRootPathFromSpacedEventIdRef(spacedEventIdRef)}/speakers/${speaker.id.value}/details`

      triggerTabbedPageNavigate(url, "forward", "push");
    }
  }
</script>

<style lang="scss" scoped>
  .btnGoToTicketing {
    --background: var(--voxxrin-event-theme-colors-secondary-hex);
    --background-activated: var(--voxxrin-event-theme-colors-secondary-hex);
  }
</style>
