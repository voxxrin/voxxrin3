<template>

</template>

<script setup lang="ts">
import {PropType} from "vue";
import {migrateData} from "@/data-migrations/migrate-data";
import {doc, setDoc} from "firebase/firestore";
import {db} from "@/state/firebase";
import {User} from "firebase/auth";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {match, P} from "ts-pattern";
import {UserLastConnection} from "../../../../shared/user-last-connection.firestore";
import {ISODatetime} from "../../../../shared/type-utils";

const props = defineProps({
  user: {
    required: true,
    type: Object as PropType<User>
  }
})

migrateData(props.user.uid);

const userLastConnexion: UserLastConnection = {
  privateUserId: props.user.uid,
  userLastConnection: new Date().toISOString() as ISODatetime,
}
// Creating user last-connection doc with (always) last known user connection in it
setDoc(doc(db, `/users/${props.user.uid}/last-connexion/self`), userLastConnexion);


const { registerTalkFeedbacksViewerSecretToken, registerEventOrganizerSecretToken, registerPrivateSpaceSecretToken } = useUserTokensWallet();
(import.meta.env.VITE_WHITE_LABEL_PREREGISTERED_USER_TOKENS || "")
  .split(",")
  .map(async rawUserToken => {
    const [type, secretToken, ...others] = rawUserToken.split("|")

    return match(type)
      .with("EventOrganizer", () =>
        match(others[0].split("@"))
          .with([P.string], ([eventId]) => registerEventOrganizerSecretToken({ secretToken, eventId }))
          .with([P.string, P.string], ([spaceToken, eventId]) => registerEventOrganizerSecretToken({ secretToken, eventId, spaceToken }))
          .otherwise(() => { })
      ).with("TalkFeedbacksViewer", () => {
        const [spaceAndEventId, talkId] = [ others[0].split("@"), others[1] ]
        match(others[0].split("@"))
          .with([P.string], ([eventId]) => registerTalkFeedbacksViewerSecretToken({ secretToken, eventId, talkId }))
          .with([P.string, P.string], ([spaceToken, eventId]) => registerTalkFeedbacksViewerSecretToken({ secretToken, spaceToken, eventId, talkId }))
          .otherwise(() => { })
      }).with("PrivateSpace", () => {
        const [ name ] = others
        registerPrivateSpaceSecretToken({ name, spaceTokens: [secretToken] })
      }).otherwise((type) => {
        console.warn(`No AuthenticatedUserContextProvider handler implemented for type: ${type}`)
      })
  })

</script>
