<template>
  <div class="infoMessage ion-text-center">
    <ion-icon :class="{ 'infoMessage-iconIllu': true, absolute: position === 'absolute' }" :src="`/assets/${illuPath}`"></ion-icon>
    <span class="infoMessage-title"><slot name="title"></slot></span>
    <span class="infoMessage-subTitle" v-if="hasSubtitleSlot"><slot name="subTitle"></slot></span>
    <ion-button v-if="!!buttonLabel" @click="$emit('button-clicked')" size="default" fill="outline" expand="block"
                :aria-label="buttonLabel">
      {{buttonLabel}}
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType} from "vue";

const props = defineProps({
    illuPath: {
        required: true,
        type: String
    },
    position: {
        required: false,
        type: String as PropType<"absolute"|undefined>
    },
    buttonLabel: {
        required: false,
        type: String as PropType<string|undefined>
    }
})

const emits = defineEmits<{
    (e: 'button-clicked'): void
}>()

const slots = defineSlots<{
    // default?: (props: { msg: string }) => any
    title: (props: { }) => any
    subTitle?: (props: { }) => any
}>()

const hasSubtitleSlot = computed(() => {
  return !!slots.subTitle
})

</script>

<style lang="scss" scoped>
.infoMessage {
  display: block;
  margin: 0 auto;
  padding: var(--app-gutters);

  &-title {
    display: block;
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 4px;
    text-align: center;
    color: var(--app-primary-shade);

    @media (prefers-color-scheme: dark) {
      color: var(--app-white);
    }
  }

  &-subTitle {
    display: block;
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
    color: var(--app-beige-dark);

    @media (prefers-color-scheme: dark) {
      opacity: 0.5;
      color: var(--app-white);
    }
  }

  &-icon {
    margin: 16px auto;
    font-size: 64px;
    color: var(--app-beige-dark);

    svg {
      min-height: 124px;
    }

    @media (prefers-color-scheme: dark) {
      color: var(--app-light-contrast);
    }
  }

  &-iconIllu {
    display: block;
    font-size: 124px;
    margin: 0 auto;

    @media (prefers-color-scheme: dark) {
      color: white;
    }

    &.absolute {
      position: absolute;
      opacity: 0.2;
      left: 0;
      top: 0;
    }
  }

  &-illustration {
    display: block;
    margin: 12px auto;
    max-width: 124px;
  }

  &._small {
    .infoMessage-iconIllu {
      font-size: 94px;
    }
  }
}
</style>
