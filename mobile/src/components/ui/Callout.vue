<template>
  <div class="ion-padding-top ion-padding-start ion-padding-end">
    <div class="callout" :class="{ ['_'+type]: true }">
      <ion-icon class="callout-illu" aria-hidden="true" :icon="icon" />
      <div class="callout-content">
        <span class="callout-content-title">{{title}}</span>
        <ion-text class="callout-content-description">
          <slot></slot>
        </ion-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {IonText} from "@ionic/vue";
import {computed, PropType, Ref} from "vue";
import {checkmarkCircle, closeCircle, informationCircle, warningSharp} from "ionicons/icons";
import {match} from "ts-pattern";

const props = defineProps({
  type: {
    required: true,
    type: String as PropType<"info"|"success"|"warning"|"error">,
  },
  title: {
    required: true,
    type: String,
  },
})

const icon = computed(() => match([props.type])
  .with(["info"], () => informationCircle)
  .with(["warning"], () => warningSharp)
  .with(["error"], () => closeCircle)
  .with(["success"], () => checkmarkCircle)
  .otherwise(() => undefined)
) as Ref<string|undefined>;

</script>

<style lang="scss" scoped>
.callout {
  position: relative;
  display: flex;
  flex-direction: row;
  column-gap: 16px;
  background-color: rgba(white, 0.5);
  border: 1px solid var(--app-beige-line);
  border-left-width: 4px;
  backdrop-filter: blur(5px);
  padding: 16px;
  border-radius: 12px;
  overflow: hidden;

  @media (prefers-color-scheme: dark) {
    background-color: var(--app-medium-contrast);
  }

  &:before {
    position: absolute;
    width: 20%;
    height: 40%;
    left: 0;
    bottom: 0;
    transform: scale(1);
    opacity: 1;
    filter: blur(32px);
    z-index: 0;
    content: '';
  }

  .callout-illu {
    flex: 0 0 auto;
    font-size: 44px;
  }

  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    row-gap: 4px;

    &-title {
      font-size: 16px;
      font-weight: 900;
    }

    &-description {
      font-size: 12px;
    }
  }

  /* Callout Type */
  $callout-color: (
    info: var(--app-voxxrin-rgb),
    success: var(--app-green-rgb),
    warning: var(--app-yellow-rgb),
    error: var(--app-red-rgb)
  );

  @each $cssClass, $callout-context in $callout-color {
    &._#{$cssClass} {
      border-left-color: rgba($callout-context, 1);

      .callout-illu { color: rgba($callout-context, 1);}
      .callout-content-title { color: rgba($callout-context, 1);}

      &:before {
        background: linear-gradient(331deg, rgba($callout-context, 0.6) 30%, rgba($callout-context, 0.6) 80%);
      }
    }
  }
}
</style>
