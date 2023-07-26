<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <div class="viewsHeader">
        <ion-button class="viewsHeader-back" @click="backButtonClicked" shape="round">
          <ion-icon src="/assets/icons/solid/checkbox-list.svg"></ion-icon>
        </ion-button>
        <ion-button class="btnUser" shape="round">
          <ion-icon src="/assets/icons/line/user-line.svg"></ion-icon>
        </ion-button>
      </div>

      <div class="viewsSubHeader">
        <div class="viewsSubHeader-title">{{ event?.headingTitle }}</div>
        <current-event-status :event="event"></current-event-status>
      </div>
    </ion-toolbar>
    <img :src="event?.backgroundUrl">
  </ion-header>
</template>

<script setup lang="ts">
import {useIonRouter} from "@ionic/vue";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const router = useIonRouter();
const props = defineProps({
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    backBtnAction: {
        require: false,
        type: String as PropType<typeof backBtnAction>
    }
})

const backBtnAction: "goBack"|"triggerEventExit" = props.backBtnAction || "triggerEventExit";
const { triggerTabbedPageGoBack } = useTabbedPageNav()

function backButtonClicked() {
    if(backBtnAction === 'goBack') {
        // standard current ion router attached to the component to go back
        // (implicitely: if current component is integrated inside tabs, back() will impact the
        // tab's history, not the tabbed page's history)
        router.back();
    } else if (backBtnAction === 'triggerEventExit') {
        // Triggering tabbed page's back, and not current tab's
        triggerTabbedPageGoBack(() => {
            // TODO: check the expected behavior, seems to work without doing anything
            // unsetCurrentSchedule();
            return Promise.resolve();
        });
    }
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
    --background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
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
      color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
    }

    .viewsSubHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      font-weight: bold;

      &-title {
        color: var(--voxxrin-event-theme-colors-primary-contrast-hex);
        font-weight: bold;
        font-size: calc(28px + 8 * (100vw - 320px) / 1024)
      }
    }
  }
</style>
