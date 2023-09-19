<template>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { pwaInfo } from 'virtual:pwa-info'
import {toastController} from "@ionic/vue";
import {watch} from "vue";
import {reload} from "ionicons/icons";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("PwaReloadPrompt");

LOGGER.info(() => pwaInfo)

const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
} = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
        // eslint-disable-next-line no-console
        LOGGER.info(() => `Service Worker at: ${swUrl}`)

        r && setInterval(async () => {
            // eslint-disable-next-line no-console
            LOGGER.debug(() => 'Checking for sw update...')
            await r.update()
        }, 60000)
    },
})

watch([needRefresh], async ([_needRefresh]) => {
    if(_needRefresh) {
        const toast = await toastController.create({
            message: 'New content available, click on reload button to update.',
            duration: undefined,
            position: 'top',
            buttons: [{
                text: 'Reload',
                side: 'end',
                icon: reload,
                role: 'reload',
                handler: () => updateServiceWorker(true),
            }],
            color: 'primary'
        })
        await toast.present()
    }
})

const close = async () => {
    offlineReady.value = false
    needRefresh.value = false
}
</script>

<style lang="scss" scoped>
</style>
