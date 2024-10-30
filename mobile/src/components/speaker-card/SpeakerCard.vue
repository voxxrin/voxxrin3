<template>
  <ion-card class="speakerCard" @click="$emit('speaker-clicked', speaker)">
    <div class="speakerCard-head">
      <div class="avatarContainer">
        <speaker-thumbnail size="64px" :is-highlighted="false" :speaker="speaker"></speaker-thumbnail>
        <div class="avatarInfos">
          <ion-text class="avatarInfos-title">{{speaker.fullName}}</ion-text>
          <ion-text class="avatarInfos-subTitle" v-if="speaker.companyName">
            <ion-icon :icon="businessSharp" aria-hidden="true"></ion-icon>
            {{ speaker.companyName }}
          </ion-text>
        </div>
      </div>
    </div>
    <div class="speakerCard-content">
      <slot name="content"></slot>
      <div class="bulletTagList" role="list" v-for="categoryCount in categoriesCount" :key="categoryCount.id">
        <div class="bulletTag" role="listitem">
          <span class="bulletTag-nb">{{categoryCount.count}}</span> {{categoryCount.categoryLabel}}
        </div>
      </div>
    </div>
  </ion-card>
</template>


<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {IonText, IonThumbnail} from "@ionic/vue";
import {businessSharp} from "ionicons/icons";
import SpeakerResumeTalk from "@/components/speaker-card/SpeakerTalk.vue";
import {SpeakerId, VoxxrinLineupSpeaker, VoxxrinSimpleSpeaker} from "@/models/VoxxrinSpeaker";
import SpeakerThumbnail from "@/components/speaker/SpeakerThumbnail.vue";
import {computed, PropType, toValue} from "vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";

const { LL } = typesafeI18n()

  const props = defineProps({
    speaker: {
      required: true,
      type: Object as PropType<VoxxrinLineupSpeaker>
    }
  })

  defineEmits<{
    (e: 'speaker-clicked', speaker: VoxxrinSimpleSpeaker): void,
  }>()

  const categoriesCount = computed(() => {
    const talks = toValue(props.speaker).talks
    return talks.reduce((categoriesCount, talk) => {
      categoriesCount[talk.format.id.value] = categoriesCount[talk.format.id.value] || { id: talk.format.id.value, categoryLabel: talk.format.title, count: 0 }
      categoriesCount[talk.format.id.value].count++;
      return categoriesCount;
    }, {} as Record<string, { id: string, categoryLabel: string, count: number }>)
  })
</script>

<style lang="scss">
  .speakerCard {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin: var(--app-gutters-medium) var(--app-gutters-small);
      border-radius: var(--app-card-radius);
      border: {
        top: 1px solid var(--app-grey-line);
        right: 1px solid var(--app-grey-line);
      }
      box-shadow: var(--app-shadow-default);
      transition: 80ms ease-in-out;

      @media (prefers-color-scheme: dark) {
        background: var(--app-light-contrast);
        border : {
          top: 1px solid var(--app-line-contrast);
          right: 1px solid var(--app-line-contrast);
        }
      }

    //* States card talk *//
    &:active {
      transition: 80ms ease-in-out;
      transform: scale(0.99);
      box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
    }

    &:before, &:after {
      position: absolute;
      content: '';
      z-index: -1;
    }

    &._is-highlighted {
      border : {
        top: 2px solid var(--app-primary);
        bottom: 2px solid var(--app-primary);
        right: 2px solid var(--app-primary);
        left: 2px solid var(--app-primary);
      }

      @media (prefers-color-scheme: dark) {
        border : {
          top: 2px solid var(--app-white) !important;
          bottom: 2px solid var(--app-white) !important;
          right: 2px solid var(--app-white) !important;
          left: 2px solid var(--app-white) !important;
        }
      }

      ion-thumbnail {
        background-color: var(--app-background);
        border: 2px solid var(--app-primary);

        @media (prefers-color-scheme: dark) {
          border: 2px solid var(--app-white) !important;
        }
      }

      &._has-liked {
        border : {
          top: 2px solid var(--app-primary-shade);
          bottom: 2px solid var(--app-primary-shade);
          right: 2px solid var(--app-primary-shade);
        }

        @media (prefers-color-scheme: dark) {
          --border : {
            top: 2px solid var(--app-white);
            bottom: 2px solid var(--app-white);
            right: 2px solid var(--app-white);
          }
        }

        .btnActionCard {
          border-color: var(--app-primary-shade);
          border-width: 2px;

          @media (prefers-color-scheme: dark) {
            border-color: var(--app-white);
          }
        }

        &:before { background: rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.6);}

        ion-thumbnail { border: 2px solid var(--app-primary-shade);}
      }
    }

    &._has-liked {
      &:before {
        width: 40%;
        height: 50%;
        right: 0;
        bottom: 0;
        transform: scale(1);
        background: linear-gradient(331deg, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4) 30%, rgba(var(--voxxrin-event-theme-colors-primary-rgb), 0.4) 80%);
        opacity: 1;
        filter: blur(32px);
        animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
      }

      &:after {
        width: 50%;
        height: 100%;
        right: 0;
        bottom: 0;
        background-image: url('/assets/images/png/texture-favorited.png');
        background-repeat: no-repeat;
        background-position: right;
        background-size: cover;
        transform: scale(1);
        opacity: 1;
        mix-blend-mode: overlay;
        animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;

        @media (prefers-color-scheme: dark) {
          mix-blend-mode: difference;
        }
      }
    }

    &-head {
      display: flex;
      align-items: center;
      gap: var(--app-gutters-medium);
      padding: var(--app-gutters-medium) var(--app-gutters-medium) var(--app-gutters-medium) 72px;

      .avatar {
        position: absolute;
        left: -18px;
        top: -8px;
        --size: 74px;
      }
    }

    &-content {
      display: flex;
      flex-direction: column;
      gap: var(--app-gutters);
      justify-content: space-between;
      padding-bottom: var(--app-gutters-medium);

      .talkResumeList {
        background: transparent;
        width: 100%;
        overflow: visible;
      }

      .bulletTagList {
        padding-left: 72px;
      }
    }
  }
</style>
