<template>
  <ion-header>
    <ion-toolbar>
      <div class="ion-modal-title">
        <ion-title>Settings list</ion-title>
        <ion-badge class="round">1</ion-badge>
      </div>
      <ion-button @click="close()" slot="start" shape="round" size="small" fill="outline">
        <ion-icon src="/assets/icons/line/close-line.svg"></ion-icon>
      </ion-button>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list class="list-toggle">
      <ion-item>
        <ion-toggle>
          <div class="ion-toggle-left">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/timer.svg"></ion-icon>
            Hide today's past time-slots after 1h
          </div>
        </ion-toggle>
      </ion-item>
      <ion-item>
        <ion-toggle>
          <div class="ion-toggle-left">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/back-circle.svg"></ion-icon>
            <div>
              Hide past time-slots
              <small>Including slots without feedback</small>
            </div>
          </div>
        </ion-toggle>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
    IonButton,
    IonButtons,
    IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar,
    modalController,
} from '@ionic/vue';
import {defineComponent, PropType} from "vue";

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
