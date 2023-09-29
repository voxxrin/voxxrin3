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

      <div class="content">
        <h3>What if I find a bug ?</h3>
        <p>Voxxrin is an opensource project, you can open an issue <a href="https://github.com/voxxrin/voxxrin3/issues" target="_blank">on our Github repository</a></p>

        <h3>As a conference organizer, I would like to reference my conference on Voxxrin</h3>
        <p>
          Please, file an issue <a href="https://github.com/voxxrin/voxxrin3/issues" target="_blank">on our Github repository</a>,
          asking for an Event Registration. Describe in the issue the way we might retrieve your schedule (is it through
          an API ? through a website ?)
        </p>

        <h3>Will there be an Android / iOS App ?</h3>
        <p>
          Yes, this is definitely <a href="https://github.com/voxxrin/voxxrin3/issues/20" target="_blank">in the roadmap</a>.
        </p>

        <h3>Who is behind the project ?</h3>
        <p>
          At the moment, we are a team of frontend developers and designers, both working for the same french company,
          <a href="https://www.4sh.fr" target="_blank">4SH</a>, which helps us by giving some free (day) time in
          addition to our nightly contributions.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {useTabbedPageNav} from "@/state/useTabbedPageNav";

const { LL } = typesafeI18n()


const {registerTabbedPageNavListeners, triggerTabbedPageExitOrNavigate} = useTabbedPageNav()
registerTabbedPageNavListeners();
</script>

<style lang="scss" scoped>
.content {
  margin: 0px 0px 0px 16px
}
</style>
