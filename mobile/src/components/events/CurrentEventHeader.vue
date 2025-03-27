<template>
  <ion-header class="ion-no-border">
    <ion-toolbar :style="{ '--background': headingBackground }">
      <div class="viewsHeader">
        <ion-button class="viewsHeader-back" @click="backButtonClicked" shape="round" :aria-label="LL.Back_List_Events()" data-testid="back-to-events-list">
          <ion-icon src="/assets/icons/solid/checkbox-list.svg"></ion-icon>
        </ion-button>
        <div class="viewsHeader-title">
          <span class="viewsHeader-name" :style="confDescriptor.theming.headingCustomStyles?.title || ''">{{ confDescriptor.headingTitle }}</span>
          <span v-if="confDescriptor.headingSubTitle"
                :style="confDescriptor.theming.headingCustomStyles?.subTitle || ''" class="viewsHeader-subTitle"
          >{{ confDescriptor.headingSubTitle }}</span>
        </div>
      </div>

      <div class="viewsSubHeader">
        <div class="viewsSubHeader-status">
          <current-event-status :conf-descriptor="confDescriptor"></current-event-status>
        </div>
      </div>
    </ion-toolbar>
    <img
      :src="!confDescriptor.theming.headingSrcSet?.length && confDescriptor.backgroundUrl ? confDescriptor.backgroundUrl : ''"
      :srcset="confDescriptor.theming.headingSrcSet?.length ? confDescriptor.theming.headingSrcSet.map(entry => `${entry.url} ${entry.descriptor}`).join(', ') : ''"
      :alt="LL.Banner_Event()"
      :style="confDescriptor.theming.headingCustomStyles?.banner || ''"
    />
  </ion-header>
</template>

<script setup lang="ts">
import {useIonRouter} from "@ionic/vue";
import CurrentEventStatus from "@/components/events/CurrentEventStatus.vue";
import {computed, PropType, ref} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()
const router = useIonRouter();
const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

const { triggerTabbedPageExitOrNavigate } = useTabbedPageNav()

function backButtonClicked() {
    // Triggering tabbed page's back, and not current tab's
    triggerTabbedPageExitOrNavigate(`/event-selector`);
}

const headingBackground = computed(() => {
  return props.confDescriptor.headingBackground || `var(--default-background)`
})
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

    .btnUser {
      height: 48px;
      width: 48px;
      --padding-start: 0;
      --padding-end: 0;
      font-size: 18px;
      --background: rgba(var(--app-white-transparent));
      --border-color: rgba(var(--app-white-transparent));
      --border-width: 1px;

      :deep(ion-icon) {
        color: white;
      }
    }
  }

  ion-toolbar {
    padding-top: 0 !important;
    position: relative;
    --default-background: linear-gradient(0deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4802) 0%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.98) 52.84%);
    z-index: 1;

    ion-title {
      position: relative;
      padding-inline: 24px;
    }

    .viewsHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-top: 16px;
      font-weight: bold;
      color: var(--voxxrin-event-theme-colors-primary-contrast-hex);

       &-title {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-content: center;
        justify-content: center;
        line-height: 1;

        @media (min-width:768px) {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          min-height: 100%;
          max-width: calc(100% - 174px);
          white-space: nowrap;

          .viewsSubHeader-name {
            font-size: clamp(55px, 5vw, 78px) !important;
          }

          .viewsSubHeader-dates {
            font-size: clamp(16px, 5vw, 24px) !important;
          }
        }

        .viewsHeader-name {
          line-height: 1;
          font-size: calc(26px + 16 * (100vw - 320px) / 1024);
          font-weight: 700;
        }

        .viewsHeader-subTitle {
          font-weight: 500;
          font-size: 15px;
        }
      }

      .btnUser {
        border: 1px solid rgba(white, 0.5);
      }
    }

    .viewsSubHeader {
      display: flex;
      align-items: end;
      justify-content: end;
      padding: 12px 0 18px 0;
      font-weight: bold;

      &-status {
        flex: 0 0 auto;
      }
    }
  }
</style>
