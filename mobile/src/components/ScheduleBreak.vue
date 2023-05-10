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
        <ion-icon class="breakIcon" :icon="icons[talkBreak.icon]"></ion-icon>
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
    event: {
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
  border-radius: 8px 12px 12px 8px;
  border : {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
    left: 6px solid var(--voxxrin-event-theme-colors-primary-hex);
  }
  box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;
  transition: 140ms ease-in-out;

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
      }

      .room {
        display: flex;
        align-items: center;
        column-gap: 2px;
        font-weight: 500;
        color: var(--app-grey-dark);

        ion-icon {
          font-size: 16px;
          color: var(--app-primary-shade);
        }
      }
    }

    .breakIcon {
      padding: 0 16px;
      font-size: 34px;
      color: var(--app-primary-shade);
    }
  }
}
</style>
