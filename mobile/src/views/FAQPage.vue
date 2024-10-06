<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)"
                      :aria-label="LL.Back_User_Dashboard()">
            <ion-icon src="/assets/icons/line/arrow-left-line.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{ LL.Frequently_asked_questions() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-accordion-group class="basicAccordion">
        <ion-accordion value="1">
          <ion-item slot="header" color="light">
            <ion-text class="title" color="secondary">
              <h6>What if I find a bug ?</h6>
            </ion-text>
          </ion-item>
          <div slot="content">
            <p>Voxxrin is an opensource project, you can open an issue
              <a href="https://github.com/voxxrin/voxxrin3/issues" target="_blank">on our Github repository</a>
            </p>
          </div>
        </ion-accordion>
        <ion-accordion value="2">
          <ion-item slot="header" color="light">
            <ion-text class="title" color="secondary">
              <h6>As a conference organizer, I would like to reference my conference on Voxxrin</h6>
            </ion-text>
          </ion-item>
          <div slot="content">
            <p>
              If you're interested in using it on your conference, you can file an issue
              <a href="https://github.com/voxxrin/voxxrin3/issues" target="_blank">on our Github repository</a>, asking for an Event Registration.
            </p>
            <p>
              Describe in the issue the way we might retrieve your schedule (is it through an API ? through a website ?)
            </p>
          </div>
        </ion-accordion>
        <ion-accordion value="3">
          <ion-item slot="header" color="light">
            <ion-text class="title" color="secondary">
              <h6>Will there be an Android / iOS App ?</h6>
            </ion-text>
          </ion-item>
          <div slot="content">
            <p>
              Yes, this is definitely <a href="https://github.com/voxxrin/voxxrin3/issues/20" target="_blank">in the roadmap</a>.
            </p>
          </div>
        </ion-accordion>
        <ion-accordion value="5">
          <ion-item slot="header" color="light">
            <ion-text class="title" color="secondary">
              <h6>Who is behind the project ?</h6>
            </ion-text>
          </ion-item>
          <div slot="content">
            <p>
              I'm <a href="https://www.linkedin.com/in/fr%C3%A9d%C3%A9ric-camblor-6978926/" target="_blank">Frédéric</a>, a passionate web developer based in France.
            </p>
            <p>
              I'm behind Voxxrin v3, with the help of <a href="https://bento.me/robinlopez" target="_blank">Robin Lopez</a>, a talented designer.
            </p>
            <p>
              We like to build apps <a href="https://github.com/voxxrin/voxxrin3" target="_blank">in the open</a>, that's why I created a company (DevXWeb SAS) to distribute Voxxrin <a href="https://www.voxxr.in" target="_blank">as a SaaS</a>.
            </p>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {typesafeI18n} from "@/i18n/i18n-vue";
import {goBackOrNavigateTo} from "@/router";
import {useIonRouter} from "@ionic/vue";

const publicUrl = import.meta.env.VITE_WHITE_LABEL_PUBLIC_URL

const ionRouter = useIonRouter();
const { LL } = typesafeI18n()

</script>

<style lang="scss" scoped>
  ion-accordion-group {
    margin: 16px;
  }

  .basicAccordion {

    ion-accordion {
      & > div {
        margin: 0 0 34px 0;
      }

      .title {
        color: var(--app-voxxrin);
      }

      &::part(content) {
        background: var(--app-background);
        color: var(--app-primary);

        @media (prefers-color-scheme: dark) {
          color: var(--app-white) !important;
        }
      }
    }
    ion-item {
      --background: var(--app-background);
      --padding-start: 0;
      --inner-padding-end: 0;

      &::part(native) {
        background: var(--app-background);
      }
    }
  }
</style>
