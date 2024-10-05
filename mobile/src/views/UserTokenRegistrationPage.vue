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
import {getRouteQueryParamValue} from "@/views/vue-utils";

const LOGGER = Logger.named("UserTokenRegistrationPage");

const ionRouter = useIonRouter();
const route = useRoute();

const {registerEventOrganizerSecretToken, registerTalkFeedbacksViewerSecretToken, registerPrivateSpaceSecretToken} = useUserTokensWallet()

onMounted(async () => {
    const tokenType = getRouteQueryParamValue(route, 'type');

    if(!tokenType) { alert("Missing token type !"); return; }

    const { success, redirectTo } = await match(tokenType)
        .with('EventOrganizer', async () => {
            const secretToken = getRouteQueryParamValue(route, 'secretToken');
            if(!secretToken) { alert("Missing secret token !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceToken = getRouteQueryParamValue(route, 'spaceToken');
            const eventId = getRouteQueryParamValue(route, 'eventId');

            if(!eventId) { alert("Missing event id !"); return { success: false, redirectTo: undefined }; }

            const spaceToken = rawSpaceToken || undefined;
            await registerEventOrganizerSecretToken({
                secretToken, spaceToken, eventId
            })

            return { success: true, redirectTo: `${getResolvedEventRootPath(new EventId(eventId), toMaybeSpaceToken(spaceToken))}/asOrganizer/${secretToken}` };
        }).with('TalkFeedbacksViewer', async () => {
            const secretToken = getRouteQueryParamValue(route, 'secretToken');
            if(!secretToken) { alert("Missing secret token !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceToken = getRouteQueryParamValue(route, 'spaceToken');
            const eventId = getRouteQueryParamValue(route, 'eventId');
            const talkId = getRouteQueryParamValue(route, 'talkId');

            if(!eventId) { alert("Missing event id !"); return { success: false, redirectTo: undefined }; }
            if(!talkId) { alert("Missing talk id !"); return { success: false, redirectTo: undefined }; }

            await registerTalkFeedbacksViewerSecretToken({
                secretToken, spaceToken: rawSpaceToken || undefined, eventId, talkId
            })

            return { success: true, redirectTo: `/user/talks` };
        }).with('PrivateSpace', async () => {
            const name = getRouteQueryParamValue(route, 'name');
            if(!name) { alert("Missing private space token name !"); return { success: false, redirectTo: undefined }; }

            const rawSpaceTokens = getRouteQueryParamValue(route, 'spaceTokens');
            if(!rawSpaceTokens) { alert("Missing space token(s) !"); return { success: false, redirectTo: undefined }; }

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
