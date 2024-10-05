<template>

</template>

<script setup lang="ts">
import {PropType, watch} from "vue";
import {migrateData} from "@/data-migrations/migrate-data";
import {collection, doc, updateDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {User} from "firebase/auth";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {match, P} from "ts-pattern";

const props = defineProps({
  user: {
    required: true,
    type: Object as PropType<User>
  }
})

migrateData(props.user.uid);

const userRef = doc(collection(db, 'users'), props.user.uid)
// Letting some time to the server to create the new user node the first time the user authenticates
// ... so that we can then update last connection date
setTimeout(() => {
  updateDoc(userRef, "userLastConnection", new Date().toISOString())
}, 30000);


const { registerTalkFeedbacksViewerSecretToken, registerEventOrganizerSecretToken } = useUserTokensWallet();
(import.meta.env.VITE_WHITE_LABEL_PREREGISTERED_USER_TOKENS || "")
  .split(",")
  .map(async rawUserToken => {
    const [type, secretToken, ...others] = rawUserToken.split("|")

    return match(type)
      .with("EventOrganizer", () => registerEventOrganizerSecretToken({ secretToken, eventId: others[0] })
      ).with("TalkFeedbacksViewer", () => registerTalkFeedbacksViewerSecretToken({ secretToken, eventId: others[0], talkId: others[1] })
      ).otherwise((type) => {
        console.warn(`No AuthenticatedUserContextProvider handler implemented for type: ${type}`)
      })
  })

</script>
