<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button color="medium" @click="close()">Close</ion-button>
      </ion-buttons>
      <ion-title>Modal Example</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    Hello world !
  </ion-content>
</template>

<script lang="ts">
import {
    IonButton,
    IonButtons,
    IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar,
    modalController,
} from '@ionic/vue';
import {defineComponent} from "vue";

export default defineComponent({
    components: {
        IonContent, IonHeader, IonTitle, IonToolbar,
        IonButtons, IonButton, IonItem, IonInput
    },
    methods: {
        close() {
            return modalController.dismiss(null, 'cancel');
        },
    },
});

</script>

<style lang="scss" scoped>
</style>
