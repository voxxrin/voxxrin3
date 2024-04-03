<template>
  <ion-page>
    <ion-content v-themed-event-styles="confDescriptor" :fullscreen="true" v-if="confDescriptor && detailedSpeaker">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline" @click="closeAndNavigateBack()"
                      :aria-label="LL.Close_speaker_details()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start" >{{ LL.Speaker_details() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="talkDetails">
        {{detailedSpeaker.fullName}}
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {useRoute} from "vue-router";
import {EventId} from "@/models/VoxxrinEvent";
import {getRouteParamsValue, isRefDefined, toManagedRef as toRef, managedRef as ref} from "@/views/vue-utils";
import {
    useUserEventTalkNotes,
    useUserTalkNoteActions,
} from "@/state/useUserTalkNotes";
import {TalkId} from "@/models/VoxxrinTalk";
import {useSharedEventTalk} from "@/state/useEventTalk";
import {computed, toValue} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonBadge, IonAvatar, IonText, useIonRouter} from "@ionic/vue";
import {business} from "ionicons/icons";
import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
import VoxDivider from "@/components/ui/VoxDivider.vue";
import {goBackOrNavigateTo} from "@/router";
import TalkDetailsHeader from "@/components/talk-details/TalkDetailsHeader.vue";
import {useEventTalkStats} from "@/state/useEventTalkStats";
import {Logger} from "@/services/Logger";
import {SpeakerId, VoxxrinDetailedSpeaker} from "@/models/VoxxrinSpeaker";

const LOGGER = Logger.named("TalkDetailsPage");

const ionRouter = useIonRouter();
function closeAndNavigateBack() {
    goBackOrNavigateTo(ionRouter, `/events/${eventId.value.value}/speakers`, 0 /* talk details page is always opened through popups */)
}

const route = useRoute();
const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
const speakerId = ref(new TalkId(getRouteParamsValue(route, 'speakerId')));
const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);

const { LL } = typesafeI18n()

const detailedSpeaker: VoxxrinDetailedSpeaker = {
  id: new SpeakerId('42'),
  fullName: "Frédéric Camblor",
  companyName: "4SH",
  photoUrl: "https://lh3.googleusercontent.com/a/AAcHTtdsbTGnaxXmrzSi178m_qpxj9c-z12qoL7SLB6cjUSfZhaQ=s96-c",
  bio: `Retired Bordeaux JUG leader and co-creator of the BDX I/O conference in 2014, Frédéric enjoys mixing with different tech communities and learning new things.
Web developer at 4SH by day, and OSS commiter by night, he has created/contributed to some more or less well known projects: Voxxrin app, Vitemadose frontend during COVID Pandemic, Devoxx France CFP, RestX framework, as well as some (old) Jenkins plugins.
As a big fan of strong typing, he loves Typescript, but also like doing all kinds of stuff in Google Spreadsheets.`,
  social: [
    {type:'twitter', url: 'https://www.twitter.com/fcamblor'}
  ]
}

</script>

<style lang="scss" scoped>
  ion-header {
    ion-toolbar {
      padding-top: 0;

      &:before, &:after {
        position: absolute;
        content: '';
        z-index: 1;
      }

    }
  }

  .speakerDetails {
  }
</style>
