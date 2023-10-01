<template>
  <ion-page>
    <ion-content :fullscreen="true" v-if="confDescriptorRef">
      <current-event-header v-if="confDescriptorRef" :conf-descriptor="confDescriptorRef" />

      <div class="contentInfoConf contentView">
        <div class="headInfoConf">
          <div class="headInfoConf-logo">
            <img :src="confDescriptorRef.logoUrl">
          </div>
        </div>

        <div class="utilsInfoConf">
          <div class="utilsInfoConf-item">
            <ion-icon aria-hidden="true" :icon="location"></ion-icon>
            <div class="utilsInfoConf-item-infos">
              <a v-if="confDescriptorRef.location.coords" :href="`geo:${confDescriptorRef.location.coords.latitude},${confDescriptorRef.location.coords.longitude}`" target="_blank">
                <div><span class="title">{{ confDescriptorRef.location.city }}, {{ confDescriptorRef.location.country }}</span></div>
                <div v-if="confDescriptorRef.location.address"><span class="subTitle">{{ confDescriptorRef.location.address }}</span></div>
              </a>
              <div v-else>
                <span class="title">{{ confDescriptorRef.location.city }}, {{ confDescriptorRef.location.country }}</span>
                <span class="subTitle" v-if="confDescriptorRef.location.address">{{ confDescriptorRef.location.address }}</span>
              </div>
            </div>
          </div>
          <div class="utilsInfoConf-item">
            <ion-icon aria-hidden="true" :icon="calendar"></ion-icon>
            <div class="utilsInfoConf-item-infos">
              <span class="title">
                <month-day-date-range :format="{separator: '>'}" :range="{ start: confDescriptorRef.start, end: confDescriptorRef.end }" /> {{ confDescriptorRef.start.year }}
              </span>
            </div>
          </div>
        </div>


        <div class="linksInfoConf" v-if="socialMedias.length">
          <vox-divider>{{ LL.Social_media() }}</vox-divider>
          <ul class="linksInfoConf-list">
            <li v-for="(socialMedia) in socialMedias" :key="socialMedia.type">
              <ion-button color="theming" slot="end" shape="round" size="small" :href="socialMedia.href">
                <ion-icon :icon="socialMedia.icon" :alt="socialMedia.label"></ion-icon>
              </ion-button>
            </li>
          </ul>
        </div>

        <div class="descriptionInfoConf" v-if="confDescriptorRef.description">
          <vox-divider>{{LL.Event_summary()}}</vox-divider>
          <ion-text>
            {{confDescriptorRef.description}}
          </ion-text>
        </div>

        <div class="sponsorsInfoConf" v-if="confDescriptorRef.sponsors?.length > 0">
          <vox-divider>{{ LL.Sponsors() }}</vox-divider>
          <ul class="sponsorsInfoConf-list" v-for="(groupedSponsor) in groupedSponsors" :key="groupedSponsor.type">
            <li v-for="(sponsor) in groupedSponsor.sponsors" :key="sponsor.name">
              <a class="sponsorItem" :href="sponsor.href" target="_blank">
                <ion-img :src="sponsor.logoUrl" :alt="sponsor.name"></ion-img>
                <span class="sponsorItem-type" :style="{'background-color': sponsor.typeColor, 'color': sponsor.typeFontColor || 'white'}">{{ sponsor.type }}</span>
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
  import {managedRef as ref, getRouteParamsValue} from "@/views/vue-utils";
  import {useSharedConferenceDescriptor} from "@/state/useConferenceDescriptor";
  import {typesafeI18n} from "@/i18n/i18n-vue";
  import {
      location,
      calendar,
      link,
      logoYoutube,
      logoLinkedin,
      logoTwitter, logoMastodon, logoInstagram, logoTwitch, logoGithub, logoFacebook, logoFlickr
  } from "ionicons/icons";
  import VoxDivider from "@/components/ui/VoxDivider.vue";
  import {IonText, IonImg} from "@ionic/vue"
  import MonthDayDateRange from "@/components/MonthDayDateRange.vue";
  import {computed, Ref, toValue} from "vue";
  import {SocialMediaType} from "../../../../shared/type-utils";
  import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
  import {match, P} from "ts-pattern";

  const { LL } = typesafeI18n()

  const route = useRoute();
  const eventId = ref(new EventId(getRouteParamsValue(route, 'eventId')));
  const {conferenceDescriptor: confDescriptorRef} = useSharedConferenceDescriptor(eventId);

  const SUPPORTED_SOCIAL_MEDIAS = {
    "website": { icon: link, label: "Website" },
    "twitter": { icon: logoTwitter, label: "Twitter" },
    "linkedin": { icon: logoLinkedin, label: "Linkedin" },
    "mastodon": { icon: logoMastodon, label: "Mastodon" },
    "instagram": { icon: logoInstagram, label: "Instagram" },
    "youtube": { icon: logoYoutube, label: "Youtube" },
    "twitch": { icon: logoTwitch, label: "Twitch" },
    "github": { icon: logoGithub, label: "Github" },
    "facebook": { icon: logoFacebook, label: "Facebook" },
    "flickr": { icon: logoFlickr, label: "Flickr" },
  } as const

  const socialMedias: Ref<Array<{type: SocialMediaType, href: string, icon: string, label: string}>> = computed(() => {
    const confDescriptor = toValue(confDescriptorRef)
    if(!confDescriptor || !confDescriptor.socialMedias) {
      return [];
    }

    return (Object.keys(SUPPORTED_SOCIAL_MEDIAS) as Array<keyof typeof SUPPORTED_SOCIAL_MEDIAS>)
      .map((socialMediaType) => {
        const confSocialMedia = confDescriptor.socialMedias?.find(sm => sm.type === socialMediaType)
        const maybeSocialMediaWithLink = confSocialMedia ? {...SUPPORTED_SOCIAL_MEDIAS[socialMediaType], ...confSocialMedia} : undefined;
        return maybeSocialMediaWithLink
      }).filter(v => !!v).map(v => v!);
  })

  const groupedSponsors = computed(() => {
      const confDescriptor = toValue(confDescriptorRef)
      if(!confDescriptor || !confDescriptor.sponsors) {
          return [];
      }

      return confDescriptor.sponsors.reduce((groupedSponsors, sponsor) => {
          const group = match([ groupedSponsors.find(group => group.type === sponsor.type) ])
              .with([ P.not(P.nullish) ], ([group]) => group)
              .otherwise(() => {
                  const newGroup = {type: sponsor.type, sponsors: []};
                  groupedSponsors.push(newGroup);
                  return newGroup;
              });

          group.sponsors.push(sponsor);

          return groupedSponsors;
      }, [] as Array<{type: string, sponsors: VoxxrinConferenceDescriptor['sponsors']}>)
  })
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
      flex-wrap: wrap;
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
      flex-wrap: wrap;
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
