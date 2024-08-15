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
import {getResolvedEventRootPath} from "@/services/Spaces";
import {EventId, toMaybeSpaceToken} from "@/models/VoxxrinEvent";

const LOGGER = Logger.named("UserTokenRegistrationPage");

const ionRouter = useIonRouter();
const route = useRoute();

const {registerEventOrganizerSecretToken, registerTalkFeedbacksViewerSecretToken, registerPrivateSpaceSecretToken} = useUserTokensWallet()

onMounted(async () => {
    const tokenType = route.query['type'] as string;

    if(!tokenType) { alert("Missing token type !"); return; }

    const { success, redirectTo } = await match(tokenType)
        .with('EventOrganizer', async () => {
            const secretToken = route.query['secretToken'] as string;
            if(!secretToken) { alert("Missing secret token !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceToken = route.query['spaceToken'] as string|undefined;
            const eventId = route.query['eventId'] as string;

            if(!eventId) { alert("Missing event id !"); return { success: false, redirectTo: undefined }; }

            const spaceToken = rawSpaceToken || undefined;
            await registerEventOrganizerSecretToken({
                secretToken, spaceToken, eventId
            })

            return { success: true, redirectTo: `${getResolvedEventRootPath(new EventId(eventId), toMaybeSpaceToken(spaceToken))}/asOrganizer/${secretToken}` };
        }).with('TalkFeedbacksViewer', async () => {
            const secretToken = route.query['secretToken'] as string;
            if(!secretToken) { alert("Missing secret token !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceToken = route.query['spaceToken'] as string|undefined;
            const eventId = route.query['eventId'] as string;
            const talkId = route.query['talkId'] as string;

            if(!eventId) { alert("Missing event id !"); return { success: false, redirectTo: undefined }; }
            if(!talkId) { alert("Missing talk id !"); return { success: false, redirectTo: undefined }; }

            await registerTalkFeedbacksViewerSecretToken({
                secretToken, spaceToken: rawSpaceToken || undefined, eventId, talkId
            })

            return { success: true, redirectTo: `/user/talks` };
        }).with('PrivateSpace', async () => {
            const name = route.query['name'] as string;
            if(!name) { alert("Missing private space token name !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceTokens = route.query['spaceTokens'] as string;
            const spaceTokens = rawSpaceTokens.split(",");

            if(!spaceTokens || !spaceTokens.length) { alert("Missing space tokens !"); return { success: false, redirectTo: undefined }; }

            await registerPrivateSpaceSecretToken({
                name, spaceTokens,
            })

            return { success: true, redirectTo: `/event-selector` };
        }).otherwise(() => {
            alert(`Unsupported type: ${tokenType}`)

            return { success: false, redirectTo: undefined };
        })

    if(success){
        LOGGER.info(() => `Successfully registered ${tokenType} token !`)
        ionRouter.replace(redirectTo)
    } else {
        LOGGER.error(() => `Error while registering token of type ${tokenType}`)
    }
})

</script>
