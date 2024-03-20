<template>
  <div class="inner-spacer">
    <ion-card class="breakCard">
      <div class="breakCard-content">
        <div class="breakCard-content-infos">
          <div class="title">{{talkBreak.title}}</div>
          <div class="room">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
            {{talkBreak.room.title}}
          </div>
        </div>
        <ion-icon class="breakIcon" :src="'/assets/images/svg/' + talkBreak.icon + '.svg'" aria-hidden="true"></ion-icon>
      </div>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {
  IonCard,
  IonIcon,
} from '@ionic/vue';
import {VoxxrinBreak} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import * as icons from "ionicons/icons";

const props = defineProps({
    talkBreak: {
        required: true,
        type: Object as PropType<VoxxrinBreak>
    },
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

</script>

<style scoped lang="scss">
.inner-spacer {padding: var(--app-gutters);}

.breakCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  padding: 8px;
  margin: 0;
  border-radius: var(--app-card-radius);
  border : {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
    bottom: 1px solid var(--app-grey-line);
    left: 6px solid var(--voxxrin-event-theme-colors-primary-hex);
  }
  box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;
  transition: 140ms ease-in-out;

  @media (prefers-color-scheme: dark) {
    background: var(--app-light-contrast);
    border : {
      top: 1px solid var(--app-line-contrast);
      right: 1px solid var(--app-line-contrast);
      bottom: 1px solid var(--app-line-contrast);
      left: 6px solid var(--voxxrin-event-theme-colors-primary-hex);
    }
  }

  &-content {
    display: flex;
    flex-direction: row;
    row-gap: 8px;
    align-items: center;

    &-infos {
      display: flex;
      flex-direction: column;
      row-gap: 8px;
      flex: 1;

      .title {
        font-weight: bolder;
        color: var(--app-primary);
        font-size: 16px;
        line-height: 1.2;

        @media (prefers-color-scheme: dark) {
          color: var(--app-white);
        }
      }
    }

    .breakIcon {
      position: absolute;
      padding: 0 8px 0 16px;
      font-size: 98px;
      color: var(--app-primary-shade);
      top: -16px;
      right: 0;


      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }
}
</style>
