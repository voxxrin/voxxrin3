<template>
  <ion-button color="theming" slot="end" shape="round" :size="size" :href="href" :aria-label="matchingMedia.label">
    <ion-icon :icon="matchingMedia.icon" :alt="matchingMedia.label"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import {IonButton} from "@ionic/vue";
import {
  link, logoFacebook, logoFlickr,
  logoGithub,
  logoInstagram,
  logoLinkedin,
  logoMastodon,
  logoTwitch,
  logoTwitter,
  logoYoutube
} from "ionicons/icons";
import {PropType} from "vue";
import {SocialMediaType} from "../../../../shared/type-utils";

const props = defineProps({
  type: {
    required: true,
    type: String as PropType<SocialMediaType>
  },
  href: {
    required: true,
    type: String
  },
  size: {
    required: false,
    type: String as PropType<"default"|"small"|"large">,
    default: 'small',
  }
})

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

const matchingMedia = SUPPORTED_SOCIAL_MEDIAS[props.type];

</script>

<style lang="scss" scoped>
</style>
