<template>
  <ion-header>
    <ion-toolbar>
      <div class="ion-modal-title">
        <ion-icon src="/assets/icons/solid/filter.svg"></ion-icon>
        <ion-title>Filters talks</ion-title>
      </div>
      <ion-button  @click="close()" slot="start" shape="round" size="default" fill="outline">
        <ion-icon src="/assets/icons/line/close-line.svg"></ion-icon>
      </ion-button>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    Hello world !
  </ion-content>
  <ion-footer>
    <ion-button slot="start" shape="round" size="default" fill="outline">
      <ion-icon src="/assets/icons/line/reload-line.svg"></ion-icon>
    </ion-button>
    <ion-button slot="end" size="default">
      Apply filter
    </ion-button>
  </ion-footer>
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
