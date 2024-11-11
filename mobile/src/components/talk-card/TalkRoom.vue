<template>
  <div class="room" v-if="confDescriptor?.features.roomsDisplayed">
    <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
    {{room.title}}
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {VoxxrinRoom} from "@/models/VoxxrinRoom";

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor|undefined>
    },
    room: {
        required: true,
        type: Object as PropType<VoxxrinRoom>
    }
})
</script>

<style lang="scss" scoped>
  .room {
    display: flex;
    align-items: center;
    column-gap: 2px;
    font-weight: 500;
    color: var(--app-primary);

    @media (prefers-color-scheme: dark) {
      color: var(--app-white-80);
    }

    ion-icon {
      font-size: 16px;
      color: var(--app-primary);

      @media (prefers-color-scheme: dark) {
        color: var(--app-white);
      }
    }
  }
</style>
