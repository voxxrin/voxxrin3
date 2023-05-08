<template>
  <ion-list class="listTalks">
    <ion-item-group v-for="(perFormatGroup, index) in perFormatGroups" :key="index">
      <ion-item-divider>
        <ion-label :style="{ '--color': perFormatGroup.format.themeColor }">
          {{perFormatGroup.format.title}} ({{perFormatGroup.format.duration}})
        </ion-label>
      </ion-item-divider>
      <ion-item v-for="(talk, talkIndex) in perFormatGroup.talks" :key="talkIndex">
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
    IonItem,
    IonLabel,
    IonList,
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

    ion-item {
      overflow: visible !important;
      --padding-start: 8px;
      --inner-padding-end: 8px;
    }
  }

  ion-item-group {
  ion-item-divider, ion-item {
      --background: var(--app-background);
      --border-style: inherit;

    ion-card {
      margin: 8px 0;
    }
    }
  }
</style>
