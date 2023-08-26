<template>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { pwaInfo } from 'virtual:pwa-info'
import {toastController} from "@ionic/vue";
import {reload} from "ionicons/icons";
import {typesafeI18n} from "@/i18n/i18n-vue";

console.log(pwaInfo)

const { LL } = typesafeI18n()

let pwaRefreshToaster: HTMLIonToastElement|undefined = undefined;
const {
    updateServiceWorker,
} = useRegisterSW({
    immediate: true,
    async onNeedRefresh() {
        console.log(`onNeedRefresh called !`)
        if(pwaRefreshToaster === undefined) {
            pwaRefreshToaster = await toastController.create({
                message: LL.value.New_content_available_click_on_reload_button_to_update_in_the_bg()+".",
                duration: undefined,
                position: 'top',
                buttons: [{
                    text: LL.value.Reload(),
                    side: 'end',
                    icon: reload,
                    role: 'reload',
                    handler: async () => {
                        await updateServiceWorker(true)
                        if(pwaRefreshToaster) {
                            await pwaRefreshToaster.dismiss();
                        }
                    }
                }],
                color: 'primary'
            })
            await pwaRefreshToaster.present()
        } else {
            console.log(`pwa refresher already opened !.. skipping...`)
        }
    },
    onRegisteredSW(swUrl, r) {
        // eslint-disable-next-line no-console
        console.log(`Service Worker at: ${swUrl}`)

        r && setInterval(async () => {
            // eslint-disable-next-line no-console
            console.debug('Checking for sw update...')
            await r.update()
        }, 60000)
    },
})

</script>

<style lang="scss" scoped>
</style>
