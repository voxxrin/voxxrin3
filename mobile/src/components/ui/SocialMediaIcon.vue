<template>
  <ion-button color="theming" slot="end" shape="round" :size="size" :href="href" :aria-label="matchingMedia.label">
    <font-awesome-icon :icon="matchingMedia.icon" :alt="matchingMedia.label" />
  </ion-button>
</template>

<script setup lang="ts">
import {IonButton} from "@ionic/vue";
import {faYoutube} from "@fortawesome/free-brands-svg-icons/faYoutube";
import {faLinkedin} from "@fortawesome/free-brands-svg-icons/faLinkedin";
import {faXTwitter} from "@fortawesome/free-brands-svg-icons/faXTwitter";
import {faMastodon} from "@fortawesome/free-brands-svg-icons/faMastodon";
import {faInstagram} from "@fortawesome/free-brands-svg-icons/faInstagram";
import {faTwitch} from "@fortawesome/free-brands-svg-icons/faTwitch";
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import {faFacebook} from "@fortawesome/free-brands-svg-icons/faFacebook";
import {faFlickr} from "@fortawesome/free-brands-svg-icons/faFlickr";
import {faBluesky} from "@fortawesome/free-brands-svg-icons/faBluesky";
import {faLink} from "@fortawesome/free-solid-svg-icons/faLink";
import {PropType} from "vue";
import {SocialMediaType} from "../../../../shared/type-utils";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

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
  "website": { icon: faLink, label: "Website" },
  "twitter": { icon: faXTwitter, label: "X (previously Twitter)" },
  "x": { icon: faXTwitter, label: "X (previously Twitter)" },
  "linkedin": { icon: faLinkedin, label: "Linkedin" },
  "mastodon": { icon: faMastodon, label: "Mastodon" },
  "instagram": { icon: faInstagram, label: "Instagram" },
  "youtube": { icon: faYoutube, label: "Youtube" },
  "twitch": { icon: faTwitch, label: "Twitch" },
  "github": { icon: faGithub, label: "Github" },
  "facebook": { icon: faFacebook, label: "Facebook" },
  "flickr": { icon: faFlickr, label: "Flickr" },
  "bluesky": { icon: faBluesky, label: "Bluesky" },
} as const

const matchingMedia = SUPPORTED_SOCIAL_MEDIAS[props.type];

</script>

<style lang="scss" scoped>
</style>
