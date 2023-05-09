<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <div class="viewsHeader">
        <ion-button @click="backToEventsList" shape="round" size="default">
          <ion-icon src="/assets/icons/solid/arrow-left.svg"></ion-icon>
        </ion-button>
        <ion-button class="btnUser" shape="round" size="default">
          <ion-icon src="/assets/icons/line/user-line.svg"></ion-icon>
        </ion-button>
      </div>

      <div class="viewsSubHeader">
        <div class="viewsSubHeader-title">{{ event?.headingName }}</div>
        <current-event-status :event="event"></current-event-status>
      </div>
    </ion-toolbar>
    <img src="/assets/images/jpg/card-conf-cover-devoxx.jpg">
  </ion-header>
</template>

<script setup lang="ts">
import {useIonRouter} from "@ionic/vue";
import CurrentEventStatus from "@/components/CurrentEventStatus.vue";
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {unsetCurrentSchedule} from "@/state/CurrentSchedule";

const router = useIonRouter();
const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

function backToEventsList() {
    unsetCurrentSchedule();

    router.navigate('/event-selector', 'back', 'pop')
}

</script>

<style scoped lang="scss">
  ion-header {
    img {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      height: 100%;
      width: 100%;
      z-index: -1;
      object-fit: cover;
    }
  }
  ion-toolbar {
    position: relative;
    --background: linear-gradient(0deg, rgba(247, 129, 37, 0.4802) 0%, rgba(247, 129, 37, 0.98) 52.84%);
    z-index: 1;

    ion-title {
      position: relative;
      padding-inline: 24px;
    }

    .viewsHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      font-weight: bold;
      color: var(--app-white);
    }

    .viewsSubHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      font-weight: bold;

      &-title {
        color: var(--app-white);
        font-weight: bold;
        font-size: calc(28px + 8 * (100vw - 320px) / 1024)
      }
    }
  }
</style>
