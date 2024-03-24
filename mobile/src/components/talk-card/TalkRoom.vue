<template>
  <div class="room" v-if="confDescriptor?.features.roomsDisplayed">
    <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
    {{talk.room.title}}
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor|undefined>
    },
    talk: {
        required: true,
        type: Object as PropType<VoxxrinTalk>
    }
})
</script>

<style lang="scss" scoped>
.room {
  display: flex;
  align-items: center;
  column-gap: 2px;
  font-weight: 500;
  color: var(--app-grey-dark);

  @media (prefers-color-scheme: dark) {
    color: rgba(white, 0.8);
  }

  ion-icon {
    font-size: 16px;
    color: var(--app-primary-shade);

    @media (prefers-color-scheme: dark) {
      color: var(--app-white);
    }
  }
}
</style>
