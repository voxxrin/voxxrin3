<template>
  <ion-list class="listTalks">
    <ion-item-group v-for="(perFormatGroup) in perFormatGroups" :key="perFormatGroup.format.id.value">
      <ion-item-divider class="listTalks-divider">
        <talk-format :format="perFormatGroup.format" />
        <span class="listTalks-divider-separator"></span>
      </ion-item-divider>

      <slot name="talk" v-for="(talk) in perFormatGroup.talks" :key="talk.id.value" :talk="talk" />
    </ion-item-group>
  </ion-list>
</template>

<script setup lang="ts">
import {PropType, computed} from "vue";
import {
    IonItemDivider,
    IonItemGroup
} from '@ionic/vue';
import {sortThenGroupByFormat, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import TalkFormat from "@/components/timeslots/TalkFormat.vue";

const props = defineProps({
    talks: {
        required: true,
        type: Array as PropType<VoxxrinTalk[]>
    },
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

const perFormatGroups = computed(() => sortThenGroupByFormat(props.talks!, props.confDescriptor!));

</script>

<style scoped lang="scss">
.listTalks {
  background: var(--app-background);
  padding: 0 4px;
  overflow: visible;

  &-divider {
    --padding-start: 8px;
    --padding-top: 12px;
    --background: transparent;
    --border-style: inherit;
    border: none;

    &-separator {
      display: block;
      height: 1px;
      width: 100%;
      margin-left: 16px;
      background-color: var(--app-beige-dark);
      flex: 1;

      @media (prefers-color-scheme: dark) {
        background-color: var(--app-line-contrast);
      }
    }
  }
}

ion-item-group {
  ion-item-divider, ion-item {

    ion-card {
      margin: 8px 0;
    }
  }
}
</style>
