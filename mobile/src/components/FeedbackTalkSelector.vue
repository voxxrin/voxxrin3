<template>
  <div>
    {{talks.length}} talks here !

    <talk-format-groups-breakdown
        :event="eventDescriptor" :day-id="dayId" :talks="talks" :is-highlighted="(talk, talkNotes) => talk.id.isSameThan(selectedTalkId)"
        @talkClicked="updateSelected($event)">
      <template #talk-card-upper-right="{ talk }">
        <div>
          <ion-icon src="/assets/icons/solid/bookmark-favorite.svg" />
          {{ LL.In_favorites() }}
        </div>
      </template>
      <template #talk-card-footer-actions="{ talk, talkNotesHook }">
        <div class="talkCard-footer-actions">
          <div class="watchLater">
            <ion-button class="btnTalk watch-later-btn" @click.stop="() => talkNotesHook.toggleWatchLater()" v-if="eventDescriptor.features.remindMeOnceVideosAreAvailableEnabled">
              <ion-icon v-if="!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/line/video-line.svg"></ion-icon>
              <ion-icon v-if="!!talkNotesHook.talkNotes?.watchLater" aria-hidden="true" src="/assets/icons/solid/video.svg"></ion-icon>
            </ion-button>
          </div>
          <div>
            <ion-button class="btnTalk" @click.stop="() => updateSelected(talk)">
              <ion-icon :icon="chatbox" v-if="talk.id.isSameThan(selectedTalkId)" />
              <ion-icon :icon="chatboxOutline" v-if="!talk.id.isSameThan(selectedTalkId)" />
            </ion-button>
          </div>
        </div>
      </template>
    </talk-format-groups-breakdown>

  </div>
</template>

<script setup lang="ts">
import {computed, Prop, PropType, ref, unref} from "vue";
import {TalkId, VoxxrinTalk} from "@/models/VoxxrinTalk";
import TalkFormatGroupsBreakdown from "@/components/TalkFormatGroupsBreakdown.vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {DayId} from "@/models/VoxxrinDay";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {chatbox, chatboxOutline} from "ionicons/icons";
import {EventId} from "@/models/VoxxrinEvent";
import {useUserTalkNotes} from "@/state/useUserTalkNotes";

const { LL } = typesafeI18n()

const props = defineProps({
    eventDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    dayId: {
        required: true,
        type: Object as PropType<DayId>
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

</script>

<style lang="scss" scoped>

</style>
