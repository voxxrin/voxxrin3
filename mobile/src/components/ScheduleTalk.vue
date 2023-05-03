<template>
  <ion-card :class="{ container: true, 'is-favorited': favorited, 'to-watch-later': toWatchLater }" >
    <div class="room">
      <ion-icon :icon="location"></ion-icon>
      {{talk.room.title}}
    </div>
    <div class="track">
      <ion-badge class="track">{{talk.track.title}}</ion-badge>
    </div>
    <div class="footer">
      <div class="speakers">
        <ion-icon :icon="megaphone"></ion-icon>
        {{displayedSpeakers}}
      </div>
      <div class="watch-later">
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
    <div class="title">{{talk.title}}</div>
    <div class="pictures">
      <ion-thumbnail v-for="(speaker, index) in talk.speakers" :key="index">
        <img :src="speaker.photoUrl" />
      </ion-thumbnail>
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
.container {  display: grid;
  grid-template-columns: 1.8fr 0.3fr 0.9fr;
  grid-template-rows: 1fr 2.7fr 75px;
  grid-auto-columns: 1fr;
  gap: 0px 0px;
  grid-auto-flow: row dense;
  grid-template-areas:
    "track room room"
    "title title pictures"
    "footer footer footer";
/*  width: 525px;  */
  width: 100%;
  height: 250px;
  padding-left: 4px;
  border-left: 6px solid v-bind('theme.track.color')
}

.room { grid-area: room; }

.track { grid-area: track; }

.footer {  display: grid;
  grid-template-columns: 1fr 100px 100px;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-auto-flow: row;
  grid-template-areas:
    "speakers watch-later favorite";
  grid-area: footer;
}

.speakers { grid-area: speakers; }

.watch-later { grid-area: watch-later; }

.favorite { grid-area: favorite; }

.title { grid-area: title; }

.pictures {
  justify-self: end;
  align-self: center;
  grid-area: pictures;
  width: 100%;
  height: 100%;
}

</style>
