<template>
    <ion-avatar :class="{ '_is-highlighted': isHighlighted }">
      <img v-if="speaker?.photoUrl" :src="speaker.photoUrl" @error="handle404OnSpeakerThumbnail($event.target as HTMLImageElement)"
           :alt="LL.Avatar_Speaker() + ' ' + speaker.fullName" />
      <img v-if="!speaker?.photoUrl" :src="baseUrl+'assets/images/svg/avatar-shadow.svg'"
           aria-hidden="true" />
    </ion-avatar>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {IonAvatar} from '@ionic/vue';
import {typesafeI18n} from "@/i18n/i18n-vue";
import {VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";

const { LL } = typesafeI18n()
const baseUrl = import.meta.env.BASE_URL;
defineProps({
  speaker: {
    required: false,
    type: Object as PropType<VoxxrinSimpleSpeaker>
  },
  isHighlighted: {
    required: true,
    type: Boolean
  },
  size: {
    required: true,
    type: String
  }
})

function handle404OnSpeakerThumbnail(img: HTMLImageElement|null) {
  if(img && img.src !== baseUrl+'assets/images/svg/avatar-shadow.svg') {
    img.src = baseUrl+'assets/images/svg/avatar-shadow.svg';
  }
}

</script>

<style lang="scss" scoped>
ion-avatar {
  max-height: v-bind(size);
  min-height: v-bind(size);
  min-width: v-bind(size);
  max-width: v-bind(size);
  margin-top: 0;
  margin-right: var(--app-gutters);

  background-color: var(--app-background);

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-medium-contrast);
  }

  &._is-highlighted {
    border: 2px solid var(--app-primary);

    @media (prefers-color-scheme: dark) {
      border: 2px solid var(--app-white) !important;
    }
  }
}
</style>
