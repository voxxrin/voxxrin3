<template>
  <ion-footer class="feedBackFooter" v-themed-event-styles="confDescriptor">
    <ion-toolbar>
      <div class="feedBackFooter-top">
        <slot name="details"></slot>
      </div>
      <div class="feedBackFooter-bottom">
        <slot></slot>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">

import {IonFooter, IonToolbar} from "@ionic/vue";
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const props = defineProps({
  confDescriptor: {
    required: true,
    type: Object as PropType<VoxxrinConferenceDescriptor>
  }
})
</script>

<style lang="scss" scoped>
.feedBackFooter {

  ion-toolbar {
    --background: var(--app-white);
    --padding-top: 12px;
    --padding-bottom: 12px;
    --padding-start: 12px;
    --padding-end: 12px;
    --min-height: 44px;
    box-shadow: 0 3px 20px rgba(0, 0, 0, 0.5);

    @media (prefers-color-scheme: dark) {
      --background: var(--app-background);
    }
  }

  &-top {
    margin-bottom: 4px;
  }

  &-top, &-bottom {
    display: flex;
    column-gap: 8px;

    :deep(ion-button) {flex: 1;}
    :deep(ion-button.cancel) {
      flex: 1 1 auto;
      max-width: 134px;
    }
  }
}
</style>
