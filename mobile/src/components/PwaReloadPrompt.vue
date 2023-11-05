<template>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { pwaInfo } from 'virtual:pwa-info'
import {toastController} from "@ionic/vue";
import {watch} from "vue";
import {reload} from "ionicons/icons";
import {Logger} from "@/services/Logger";
import {typesafeI18n} from "@/i18n/i18n-vue";

const LOGGER = Logger.named("PwaReloadPrompt");

const { LL } = typesafeI18n()

LOGGER.info(() => pwaInfo)

const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
} = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
        LOGGER.info(() => `Service Worker at: ${swUrl}`)

        r && setInterval(async () => {
            LOGGER.debug(() => 'Checking for sw update...')
            await r.update()
        }, 60000)
    },
})

watch([needRefresh], async ([_needRefresh]) => {
    if(_needRefresh) {
        updateServiceWorker(true);
        // const toast = await toastController.create({
        //     message: LL.value.New_content_available_click_on_reload_button_to_update(),
        //     duration: undefined,
        //     position: 'top',
        //     buttons: [{
        //         text: LL.value.Reload(),
        //         side: 'end',
        //         role: 'reload',
        //         handler: () => updateServiceWorker(true),
        //     }],
        //     cssClass: 'majNotification',
        // })
        // await toast.present()
    }
})

const close = async () => {
    offlineReady.value = false
    needRefresh.value = false
}
</script>

<style lang="scss" scoped>
</style>
