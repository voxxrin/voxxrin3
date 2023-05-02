<template>
  <ion-list>
    <ion-item v-for="(perFormatGroup, index) in perFormatGroups" :key="index">
      <ion-label :style="{ '--color': perFormatGroup.format.themeColor }">
        {{perFormatGroup.format.title}} ({{perFormatGroup.format.duration}})
      </ion-label>
      {{perFormatGroup.talks.length}} talks ici !
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {
    IonItem,
    IonLabel,
    IonList,
} from '@ionic/vue';
import {sortThenGroupByFormat, VoxxrinTalk} from "@/models/VoxxrinTalk";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";


const props = defineProps({
    talks: {
        required: true,
        type: Array as PropType<VoxxrinTalk[]>
    },
    event: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    }
})

const perFormatGroups = sortThenGroupByFormat(props.talks!, props.event!);

</script>

<style scoped>

</style>
