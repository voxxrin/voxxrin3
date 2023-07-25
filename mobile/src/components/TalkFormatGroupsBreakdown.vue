<template>
  <ion-list class="listTalks">
    <ion-item-group v-for="(perFormatGroup) in perFormatGroups" :key="perFormatGroup.format.id.value">
      <ion-item-divider class="listTalks-divider">
        <ion-icon src="/assets/images/svg/format-symbol.svg" :style="{ 'color': perFormatGroup.format.themeColor }"></ion-icon>
        <ion-label :style="{ '--color': perFormatGroup.format.themeColor }">
          {{perFormatGroup.format.title}} ({{perFormatGroup.format.hmmDuration}})
        </ion-label>
        <span class="listTalks-divider-separator"></span>
      </ion-item-divider>
      <ion-item class="listTalks-item" v-for="(talk) in perFormatGroup.talks" :key="talk.id.value">
        <schedule-talk :talk="talk" @talkClicked="$emit('talk-clicked', $event)" :is-highlighted="isHighlighted" :event="event">
          <template #upper-right="upperRightContext">
            <slot name="talk-card-upper-right" :talk="upperRightContext.talk" :talkNotesHook="upperRightContext.talkNotesHook" />
          </template>
          <template #footer-actions="footerActionsContext">
            <slot name="talk-card-footer-actions" :talk="footerActionsContext.talk" :talkNotesHook="footerActionsContext.talkNotesHook" />
          </template>
        </schedule-talk>
      </ion-item>
    </ion-item-group>
  </ion-list>
</template>

<script setup lang="ts">
import {PropType, computed} from "vue";
import {
    IonItemDivider,
    IonItemGroup
} from '@ionic/vue';
import {sortThenGroupByFormat, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {TalkNote} from "../../../shared/feedbacks.firestore";


const props = defineProps({
    talks: {
        required: true,
        type: Array as PropType<VoxxrinTalk[]>
    },
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    isHighlighted: {
        required: true,
        type: Function as PropType<(talk: VoxxrinTalk, talkNotes: TalkNote) => boolean>
    }
})

defineEmits<{
    (e: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

const perFormatGroups = computed(() => sortThenGroupByFormat(props.talks!, props.event!));

</script>

<style scoped lang="scss">
  .listTalks {
    background: var(--app-background);
    padding: 0 var(--app-gutters);
    overflow: visible;

    &-divider {
      --padding-start: 0;
      --padding-top: 12px;
      --background: transparent;
      --border-style: inherit;
      border: none;

      ion-icon {
        font-size: 24px;
      }

      ion-label {
        padding-left: 8px;
        font-size: 16px;
        font-weight: 900;
      }

      &-separator {
        display: block;
        height: 1px;
        width: 100%;
        margin-left: 16px;
        background-color: var(--app-beige-dark);
        flex: 1;

        @media (prefers-color-scheme: dark) {
          background-color: var(--app-line-contrast);
        }
      }
    }

    &-item {
      overflow: visible !important;
      --padding-start: 0;
      --inner-padding-end: 0;
      --background: transparent;
      --border-style: none;

      &:last-child {
        margin-bottom: var(--app-gutters);
      }
    }
  }

  ion-item-group {
    ion-item-divider, ion-item {

      ion-card {
        margin: 8px 0;
      }
    }
  }
</style>
