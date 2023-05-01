<template>
  <ion-accordion :value="timeslot.id" :class="{ [`_${progress?.status}`]: true, '_feedback-provided': !!timeslotFeedback, '_missing-feedback': !timeslotFeedback }">
    <ion-item slot="header" color="light">
      <ion-grid>
        <ion-row>
          <ion-col size="1">
            <ion-icon class="_accordion-icon _ongoing-icon" aria-hidden="true" :icon="hourglass"></ion-icon>
            <ion-icon class="_accordion-icon _past-icon" aria-hidden="true" :icon="caretBackCircle"></ion-icon>
            <ion-icon class="_accordion-icon _future-icon" aria-hidden="true" :icon="time"></ion-icon>
          </ion-col>
          <ion-col size="5">
            <ion-label>{{timeslotLabel.start}} -> {{timeslotLabel.end}}</ion-label>
          </ion-col>
          <ion-col size="6">
            <ion-progress-bar class="_ongoing-progress" v-if="progress?.status === 'ongoing'" :value="progress.progressInPercent / 100"></ion-progress-bar>
            <ion-icon class="_missing-feedback" aria-hidden="true" :icon="checkmarkDone"></ion-icon>
            <ion-button class="_provided-feedback">
              <ion-icon :icon="chatboxEllipses"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-item>

    <div class="ion-padding _accordion-content" slot="content">
      Content for {{timeslot.id}}
    </div>
  </ion-accordion>
</template>

<script setup lang="ts">
import {PropType, ref} from "vue";
import {
    IonIcon,
    IonProgressBar,
    IonAccordion,
    IonItem,
    IonButton,
    IonLabel,
    IonRow,
    IonCol,
    IonGrid,
} from '@ionic/vue';
import {
    getTimeslotLabel,
    getTimeslotTimingProgress,
    TimeslotTimingProgress,
    VoxxrinScheduleTimeSlot
} from "@/models/VoxxrinSchedule";
import {VoxxrinTimeslotFeedback} from "@/models/VoxxrinFeedback";
import {useInterval} from "@/views/vue-utils";
import {useCurrentClock} from "@/state/CurrentClock";
import {caretBackCircle, chatboxEllipses, checkmarkDone, hourglass, time} from "ionicons/icons";

const props = defineProps({
    timeslot: {
        required: true,
        type: Object as PropType<VoxxrinScheduleTimeSlot>
    },
    timeslotFeedback: {
        required: false,
        type: Object as PropType<VoxxrinTimeslotFeedback|undefined>
    }
})

const progress = ref<TimeslotTimingProgress>()
useInterval(() => {
    if(props.timeslot) {
        progress.value = getTimeslotTimingProgress(props.timeslot, useCurrentClock().zonedDateTimeISO())
    }
}, import.meta.env.DEV?{seconds:4}:{minutes:1}, { immediate: true });

const timeslotLabel = getTimeslotLabel(props.timeslot!);

</script>

<style scoped>
/* Defaults for togglable icons/buttons/progressbar */
ion-accordion {
  ._accordion-icon, ._missing-feedback, ._provided-feedback, ._ongoing-progress {
    display: none;
  }
}

ion-accordion._past ._accordion-icon._past-icon { display: inline-block; }
ion-accordion._ongoing ._accordion-icon._ongoing-icon { display: inline-block; }
ion-accordion._future ._accordion-icon._future-icon { display: inline-block; }

ion-accordion._past._missing-feedback ._missing-feedback {
  display: inline-block;
}
ion-accordion._past._feedback-provided ._provided-feedback {
  display: inline-block;
}
ion-accordion._ongoing ._ongoing-progress {
  display: block;
}

ion-accordion._past ._accordion-content {
  font-style: italic;
}

</style>
