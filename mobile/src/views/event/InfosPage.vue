<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <current-event-header v-if="confDescriptor" :conf-descriptor="confDescriptor" />

      <div class="contentInfoConf contentView">
        <div class="headInfoConf">
          <div class="headInfoConf-logo">
            <img src="./">
          </div>
          <div class="headInfoConf-actions">
            <ion-button slot="end" shape="round" size="small" fill="outline" v-if="true">
              <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>
            </ion-button>
          </div>
        </div>

        <div class="utilsInfoConf">
          <div class="utilsInfoConf-item">
            <ion-icon aria-hidden="true" :icon="location"></ion-icon>
            <div class="utilsInfoConf-item-infos">
              <span class="title">75017 Paris, FRANCE</span>
              <span class="subTitle">2 Place de la porte maillot</span>
            </div>
          </div>
          <div class="utilsInfoConf-item">
            <ion-icon aria-hidden="true" :icon="calendar"></ion-icon>
            <div class="utilsInfoConf-item-infos">
              <span class="title">Du 12 au 14 Avril</span>
            </div>
          </div>
        </div>

        <ion-button size="default" expand="block">
          Event plans
          <ion-icon aria-hidden="true" :icon="map" slot="end"></ion-icon>
        </ion-button>

        <div class="linksInfoConf">
          <vox-divider>Utils links</vox-divider>
          <ul class="linksInfoConf-list">
            <li v-if="true">
              <ion-button color="theming" slot="end" shape="round" size="small">
                <ion-icon :icon="link"></ion-icon>
              </ion-button>
            </li>
            <li>
              <ion-button color="theming" slot="end" shape="round" size="small">
                <ion-icon :icon="logoYoutube"></ion-icon>
              </ion-button>
            </li>
            <li>
              <ion-button color="theming" slot="end" shape="round" size="small">
                <ion-icon :icon="logoFacebook"></ion-icon>
              </ion-button>
            </li>
            <li>
              <ion-button color="theming" slot="end" shape="round" size="small">
                <ion-icon :icon="logoLinkedin"></ion-icon>
              </ion-button>
            </li>
            <li>
              <ion-button color="theming" slot="end" shape="round" size="small">
                <ion-icon :icon="logoFlickr"></ion-icon>
              </ion-button>
            </li>
          </ul>
        </div>

        <div class="descriptionInfoConf">
          <vox-divider>Event summary</vox-divider>
          <ion-text>
            Depuis plus de 10 ans, la conférence Devoxx France propose pendant 3 jours de venir partager et écouter plus de 200 présentations, par 240 orateurs.
            La conférence est accompagnée d’un salon/hall d’exposition avec 70 exposants.
            Avec plus de 3200 participants, orateurs et exposants en avril 2022 dernier, c’est l’un des événements les plus importants pour la communauté des développeurs, en France.Devoxx France est l’occasion de faire des rencontres, de venir découvrir les dernières technologies et de participer à un grand moment communautaire.
          </ion-text>
        </div>

        <div class="sponsorsInfoConf">
          <vox-divider>Sponsors</vox-divider>
          <ul class="sponsorsInfoConf-list">
            <li v-if="true">
              <a class="sponsorItem" :class="'_type1'">
                <ion-img :src="'https://www.devoxx.fr/wp-content/uploads/2019/09/logo_devoxx_france_2019_simple-1.png'"></ion-img>
                <span class="sponsorItem-type">Diamond</span>
              </a>
            </li>
            <li v-if="true">
              <a class="sponsorItem" :class="'_type1'">
                <ion-img :src="'https://www.devoxx.fr/wp-content/uploads/2019/09/logo_devoxx_france_2019_simple-1.png'"></ion-img>
                <span class="sponsorItem-type">Diamond</span>
              </a>
            </li>
            <li v-if="true">
              <a class="sponsorItem" :class="'_type2'">
                <ion-img :src="'https://www.devoxx.fr/wp-content/uploads/2019/09/logo_devoxx_france_2019_simple-1.png'"></ion-img>
                <span class="sponsorItem-type">Platinium</span>
              </a>
            </li>
            <li v-if="true">
              <a class="sponsorItem" :class="'_type2'">
                <ion-img :src="'https://www.devoxx.fr/wp-content/uploads/2019/09/logo_devoxx_france_2019_simple-1.png'"></ion-img>
                <span class="sponsorItem-type">Platinium</span>
              </a>
            </li>
            <li v-if="true">
              <a class="sponsorItem" :class="'_type2'">
                <ion-img :src="'https://www.devoxx.fr/wp-content/uploads/2019/09/logo_devoxx_france_2019_simple-1.png'"></ion-img>
                <span class="sponsorItem-type">Platinium</span>
              </a>
            </li>
          </ul>
        </div>
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
  import {managedRef as ref} from "@/views/vue-utils";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {
    location,
    calendar,
    map,
    link,
    logoYoutube,
    logoFacebook,
    logoLinkedin,
    logoFlickr,
    diamond
  } from "ionicons/icons";
  import VoxDivider from "@/components/ui/VoxDivider.vue";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptor} = useSharedConferenceDescriptor(eventId);
</script>

<style lang="scss" scoped>

  .contentInfoConf {
    display: flex;
    flex-direction: column;
    row-gap: 16px;
  }

  .headInfoConf {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .utilsInfoConf {
    background: var(--app-white);
    border-radius: var(--app-bloc-radius);
    border: 1px solid var(--app-beige-line);

    &-item {
      position: relative;
      display: flex;
      flex-direction: row;
      column-gap: 16px;
      padding: 16px;

      &:last-child { &:after {display: none;}}

      &:after {
        position: absolute;
        bottom: 0;
        right: 0;
        height: 1px;
        width: calc(100% - 44px);
        background: var(--app-beige-line);
        content: '';
      }

      ion-icon {
        font-size: 28px;
        color: var(--app-beige-dark);
      }

      &-infos {
        display: flex;
        flex-direction: column;
        justify-content: center;
        row-gap: 4px;


        .title {
          font-weight: bold;
          color: var(--app-primary);
        }

        .subTitle {
          font-size: 12px;
          color: var(--app-grey-dark);
        }
      }
    }
  }

  .linksInfoConf {
    &-list {
      display: flex;
      flex-direction: row;
      column-gap: 8px;
      margin: 0;
      padding: 0;

      li {
        list-style: none;
      }
    }
  }

  .sponsorsInfoConf {
    &-list {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      column-gap: 16px;
      position: relative;
      left: -16px;
      width: calc(100% + 34px);
      margin: 0;
      padding: 16px;
      overflow-y: auto;

      li {list-style: none;}

      .sponsorItem {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 94px;
        width: 94px;
        padding: 0 8px;
        border-radius: 74px;
        background: var(--app-white);
        border: 1px solid var(--app-beige-line);

        &._type1 { .sponsorItem-type { background-color: #9CBFC7;}}
        &._type2 { .sponsorItem-type { background-color: #A79CC7;}}


        &-type {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translate(-50%, 0);
          padding: 4px 8px;
          font-size: 13px;
          border-radius: 8px;
          font-weight: 900;
          color: var(--app-white);
        }
      }
    }
  }
</style>
