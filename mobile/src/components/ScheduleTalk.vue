<template>
  <ion-card class="talkCard" :class="{ container: true, 'is-favorited': favorited, 'to-watch-later': toWatchLater }" >
    <div class="talkCard-head">
      <div class="track">
        <ion-badge class="track">{{talk.track.title}}</ion-badge>
      </div>

      <div class="room">
        <ion-icon aria-hidden="true" src="/assets/icons/solid/map-marker.svg"></ion-icon>
        {{talk.room.title}}
      </div>
    </div>

    <div class="talkCard-content">
      <div class="title">{{talk.title}}</div>
      <div class="pictures">
        <div class="picturesItem" v-for="(speaker, index) in talk.speakers" :key="index">
          <ion-thumbnail>
            <img :src="speaker.photoUrl" />
          </ion-thumbnail>
        </div>
      </div>
    </div>

    <div class="talkCard-footer">
      <div class="speakers">
        <ion-icon :icon="megaphone"></ion-icon>
        {{displayedSpeakers}}
      </div>
      <div class="talkCard-footer-actions">
        <div class="watchLater">
          <ion-button class="btnTalk watch-later-btn">
            <ion-icon :icon="videocam"></ion-icon>
          </ion-button>
        </div>
        <div class="favorite">
          <ion-button class="btnTalk favorite-btn">
            <ion-icon class="favorite-btn-icon" v-if="!favorited" src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
            <ion-icon class="favorite-btn-icon" v-if="favorited" src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
            <ion-label class="favorite-btn-nb" v-if="favoritesCount">{{ favoritesCount }}</ion-label>
          </ion-button>
        </div>
      </div>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import {PropType, ref, watch} from "vue";
import {
    IonIcon,
    IonBadge,
    IonThumbnail,
    IonButton,
    IonCard,
    IonLabel
} from '@ionic/vue';
import { VoxxrinTalk} from "@/models/VoxxrinTalk";
import {bookmark, location, megaphone, videocam} from "ionicons/icons";

const props = defineProps({
    talk: {
        required: true,
        type: Object as PropType<VoxxrinTalk>
    },
    favorited: {
        required: true,
        type: Boolean
    },
    toWatchLater: {
        required: true,
        type: Boolean
    },
    favoritesCount: {
        required: false,
        type: Number
    }
})

const displayedSpeakers = props.talk!.speakers
    .map(s => `${s.fullName}${s.companyName?` (${s.companyName})`:``}`)
    .join(", ");

const theme = {
    track: { color: props.talk!.track.themeColor }
}

</script>

<style lang="scss" scoped>

ion-badge.track {
  --background: v-bind('theme.track.color')
}

.speakers {
  color: v-bind('theme.track.color');
}

.is-favorited ion-button.favorite-btn {
  --background: var(--app-theme-primary);
  --color: var(--app-white);
  border-left: 1px solid var(--app-theme-primary);
}
.to-watch-later ion-button.watch-later-btn {
  --background: var(--app-voxxrin);
  --color: var(--app-white);
  border-left: 1px solid var(--app-voxxrin);
}

/* see this grid layout config: https://grid.layoutit.com/?id=iRG8xLp */

.talkCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  width: 100%;
  border-left: 6px solid v-bind('theme.track.color');
  border : {
    top: 1px solid var(--app-grey-line);
    right: 1px solid var(--app-grey-line);
    bottom: 1px solid var(--app-grey-line);
  }

  &-head {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 8px 16px 8px 16px;

    .room {
      display: flex;
      align-items: center;
      column-gap: 2px;
      color: var(--app-grey-dark);

      ion-icon {
        font-size: 16px;
        color: var(--app-primary-medium);
      }
    }
  }

  &-content {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 0 16px;

    .title {
      flex: 1 1 0;
      font-weight: bolder;
      color: var(--app-primary);
      font-style: normal;
      font-size: 16px;
      line-height: 1.2;
    }

    .pictures {
      display: flex;
      flex-direction: row;
      flex: 0 0 auto;

      .picturesItem {
        width: 24px;

        &:last-child {
          margin-right: 24px;
        }

        ion-thumbnail {
          --size: 48px;
          --border-radius: 40px;
          filter: drop-shadow(-4px 0px 4px rgba(0, 0, 0, 0.15));

        }
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    border : {
      top: 1px solid var(--app-grey-line);
      right: 1px solid var(--app-grey-line);
      bottom: 1px solid var(--app-grey-line);
    }

    .btnTalk {
      height: 48px;
      width: 58px;
      margin: 0;
      --border-radius: 0;
      --background: transparent;
      --color: var(--app-primary);
      border-left: 1px solid var(--app-grey-line);
      font-size: 18px;
      --padding-start: 0;
      --padding-end: 0;

      .favorite-btn {
        --size: 28px;

        &-icon {
          position: relative;
          top: -6px;
          font-size: 26px;
        }

        &-nb {
          position: absolute;
          bottom: 5px;
          font-size: 11px;
          font-weight: 900;
        }
      }
    }


    &-actions {
      display: flex;
    }
  }
}
</style>
