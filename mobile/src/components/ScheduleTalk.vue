<template>
  <ion-card class="talkCard" :class="{ container: true, 'is-favorited': favorited, 'to-watch-later': toWatchLater }" >
    <div class="talkCard-head">
      <div class="track">
        <ion-badge class="track">{{talk.track.title}}</ion-badge>
      </div>

      <div class="room">
        <ion-icon :icon="location"></ion-icon>
        {{talk.room.title}}
      </div>
    </div>

    <div class="talkCard-content">
      <div class="title">{{talk.title}}</div>
      <div class="pictures">
        <ion-thumbnail v-for="(speaker, index) in talk.speakers" :key="index">
          <img :src="speaker.photoUrl" />
        </ion-thumbnail>
      </div>
    </div>

    <div class="talkCard-footer">
      <div class="speakers">
        <ion-icon :icon="megaphone"></ion-icon>
        {{displayedSpeakers}}
      </div>
      <div class="talkCard-footer-actions">
        <div class="watchLater">
          <ion-button class="watch-later-btn">
            <ion-icon :icon="videocam"></ion-icon>
          </ion-button>
        </div>
        <div class="favorite">
          <ion-button class="favorite-btn">
            <ion-icon :icon="bookmark"></ion-icon>
            <ion-label v-if="favoritesCount">{{ favoritesCount }}</ion-label>
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



ion-thumbnail {
  --size: 80px;
  --border-radius: 40px;
}

ion-button {
  &.watch-later-btn, &.favorite-btn {
    width: 100%;
    height: 100%;
  }
}

ion-badge.track {
  --background: v-bind('theme.track.color')
}

.speakers {
  color: v-bind('theme.track.color');
}

.is-favorited ion-button.favorite-btn {
  --background: var(--ion-color-danger)
}
.to-watch-later ion-button.watch-later-btn {
  --background: var(--ion-color-secondary)
}

/* see this grid layout config: https://grid.layoutit.com/?id=iRG8xLp */

.talkCard {
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  width: 100%;
  border-left: 6px solid v-bind('theme.track.color');

  &-head {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 16px;
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

      ion-thumbnail {
        height: 48px;
        width: 48px;
        border: 2px solid var(--app-primary);
        box-shadow: rgb(0 0 0 / 24%) -3px 3px 6px 0px;
      }
    }
  }

  &-footer {
    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    padding: 0 16px;

    &-actions {
      display: flex;
    }
  }
}
</style>
