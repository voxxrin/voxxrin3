<template>
  <ion-page>
  </ion-page>
</template>
<script setup lang="ts">
import {onMounted} from "vue";
import {useIonRouter} from "@ionic/vue";
import {useRoute} from "vue-router";
import {match} from "ts-pattern";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("UserTokenRegistrationPage");

const ionRouter = useIonRouter();
const route = useRoute();

const {registerEventOrganizerSecretToken, registerTalkFeedbacksViewerSecretToken} = useUserTokensWallet()

onMounted(async () => {
    const tokenType = route.query['type'] as string;
    const secretToken = route.query['secretToken'] as string;
    if(!tokenType) { alert("Missing token type !"); return; }
    if(!secretToken) { alert("Missing secret token !"); return; }

    const success = await match(tokenType)
        .with('EventOrganizer', async () => {
            const eventId = route.query['eventId'] as string;

            if(!eventId) { alert("Missing event id !"); return false; }

            await registerEventOrganizerSecretToken({
                secretToken, eventId
            })

            return true;
        }).with('TalkFeedbacksViewer', async () => {
            const eventId = route.query['eventId'] as string;
            const talkId = route.query['talkId'] as string;

            if(!eventId) { alert("Missing event id !"); return false; }
            if(!talkId) { alert("Missing talk id !"); return false; }

            await registerTalkFeedbacksViewerSecretToken({
                secretToken, eventId, talkId
            })

            return true;
        }).otherwise(() => {
            alert(`Unsupported type: ${tokenType}`)

            return false;
        })

    if(success){
        LOGGER.info(() => `Successfully registered ${tokenType} token !`)
        ionRouter.replace('/event-selector')
    } else {
        LOGGER.error(() => `Error while registering token of type ${tokenType}`)
    }
})

</script>
