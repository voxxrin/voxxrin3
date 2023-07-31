<template>
  <ion-header>
    <ion-toolbar>
      <div class="ion-modal-title">
        <ion-title>{{ LL.Settings_list() }}</ion-title>
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
            {{ LL.Hide_today_s_past_time_slots_after_1h() }}
          </div>
        </ion-toggle>
      </ion-item>
      <ion-item>
        <ion-toggle>
          <div class="ion-toggle-left">
            <ion-icon aria-hidden="true" src="/assets/icons/solid/back-circle.svg"></ion-icon>
            <div>
              {{ LL.Hide_past_time_slots() }}
              <small>{{ LL.Including_slots_without_feedback() }}</small>
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
import {defineComponent} from "vue";
import {typesafeI18n} from "@/i18n/i18n-vue";

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
    setup() {
        const { LL } = typesafeI18n()

        return { LL }
    }
});
</script>

<style lang="scss" scoped>

</style>
