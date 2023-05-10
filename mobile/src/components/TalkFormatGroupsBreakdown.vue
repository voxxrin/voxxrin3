<template>
  <ion-list class="listTalks">
    <ion-item-group v-for="(perFormatGroup, index) in perFormatGroups" :key="index">
      <ion-item-divider class="listTalks-divider">
        <ion-icon src="/assets/images/svg/format-symbol.svg" :style="{ 'color': perFormatGroup.format.themeColor }"></ion-icon>
        <ion-label :style="{ '--color': perFormatGroup.format.themeColor }">
          {{perFormatGroup.format.title}} ({{perFormatGroup.format.duration}})
        </ion-label>
        <span class="listTalks-divider-separator"></span>
      </ion-item-divider>
      <ion-item class="listTalks-item" v-for="(talk, talkIndex) in perFormatGroup.talks" :key="talkIndex">
        <schedule-talk :talk="talk"
             :favorited="Math.ceil(Math.random()*2)%2===0"
             :to-watch-later="Math.ceil(Math.random()*2)%2===0"
             :favorites-count="Math.ceil(Math.random()*50)"
        ></schedule-talk>
      </ion-item>
    </ion-item-group>
  </ion-list>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
    IonItemDivider,
    IonItemGroup
} from '@ionic/vue';
import {sortThenGroupByFormat, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import ScheduleTalk from "@/components/ScheduleTalk.vue";


const props = defineProps({
    talks: {
        required: true,
        type: Array as PropType<VoxxrinTalk[]>
    },
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

const perFormatGroups = sortThenGroupByFormat(props.talks!, props.event!);

</script>

<style scoped lang="scss">
  .listTalks {
    padding: 0;
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
