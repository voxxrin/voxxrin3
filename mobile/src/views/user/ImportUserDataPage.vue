<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="triggerTabbedPageExitOrNavigate(`/user/dashboard`)">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{ LL.Frequently_asked_questions() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      Import page here :
      <ul>
        <li v-if="step >= 1">Step 1 : Retrieving data (with spinner)</li>
        <li v-if="step >= 2">Step 2 : Importing data (with spinner)</li>
        <li v-if="step >= 3">Step 3 : Data imported successfully</li>
      </ul>
    </ion-content>
  </ion-page>

</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";
import {managedRef as ref} from "@/views/vue-utils";

const { LL } = typesafeI18n()

const step = ref(1)
setTimeout(() => { step.value = 2; }, 3000)
setTimeout(() => { step.value = 3; }, 6000)

const {registerTabbedPageNavListeners, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()
registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
li {
  animation: scale-in-center 0.1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}
</style>
