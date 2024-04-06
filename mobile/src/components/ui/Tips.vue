<template>
  <div class="tipsBloc">
    <ion-icon :icon="informationCircle"></ion-icon>
    <span class="tipsBloc-txt">{{txt}}</span>
  </div>
</template>

<script setup lang="ts">
  import {IonIcon} from "@ionic/vue";
  import {computed, PropType, Ref} from "vue";
  import {informationCircle} from "ionicons/icons";

  const props = defineProps({
    txt: {
      required: true,
      type: String,
    },
  })
</script>

<style lang="scss" scoped>
.tipsBloc {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  padding: 8px 12px;
  background-color: var(--app-primary);
  border-radius: 8px;

  @media (prefers-color-scheme: dark) {
    border: 1px solid var(--app-line-contrast-rgb);
    background-color: var(--app-dark-contrast);
  }

  ion-icon {
    color: white;
    font-size: 22px;
  }

  &-txt {
    color: var(--app-white);
    font-size: 14px;
  }
}
</style>
