<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="confDescriptor" :conf-descriptor="confDescriptor" />

      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-title slot="start" >Favorites</ion-title>
          <ion-button slot="end" shape="round" size="small">
            <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <div class="infoMessage ion-text-center">
        <ion-icon class="infoMessage-iconIllu" src="/assets/images/svg/illu-no-favorites.svg"></ion-icon>
        <span class="infoMessage-title">🚧 {{ LL.Favorited_schedule_not_implemented_yet() }}</span>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
  import CurrentEventHeader from "@/components/events/CurrentEventHeader.vue";
  import {useRoute} from "vue-router";
  import {EventId} from "@/models/VoxxrinEvent";
  import {getRouteParamsValue} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {ref} from "vue";
  import {typesafeI18n} from "@/i18n/i18n-vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
</script>
