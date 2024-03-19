<template>
  <ion-page>
    <ion-content>
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      :aria-label="LL.Back_User_Dashboard()"
                      @click="goBackOrNavigateTo(ionRouter, `/user/dashboard`, 0)">
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
              Please, note that Voxxrin should be considered as in a <strong>closed beta</strong> for new conference organizers.
            </p>
            <p>
              That being said, if you're interested in using it on your conference, you can file an issue
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
        <ion-accordion value="4">
          <ion-item slot="header" color="light">
            <ion-text class="title" color="secondary">
              <h6>There is this "New content available" banner which keeps popping again and again (<em>this is annoying</em>)</h6>
            </ion-text>
          </ion-item>
          <div slot="content">
            <p>
              Voxxrin uses Service Workers which helps providing a good offline experience by caching every web assets
              (<em>like: js ,css, speaker pictures and so on..</em>) and serving it from cache when needed.
            </p>
            <p>
              Service Worker instance is <strong>shared</strong> across all the browser tabs of the {{publicUrl}} website, meaning that when an update of the
              service worker is detected (<em>generally, after a new Voxxrin deployment</em>) this banner is shown to end users.
            </p>
            <p>
              Problem is: Voxxrin app <strong>doesn't have control over <u>when</u></strong> the browser is going to update the Service Worker process as this involves
              several processes (such as downloading and caching new assets in the background).
            </p>
            <p>
              It means that when you click <strong>Reload</strong> button, browser works in the background, potentially waiting for other opened tabs
              on the same website, and refreshing stuff in its cache.<br/>
              If you refresh the app during this period of time, you will keep having this banner, giving you the impression that Reloading SW
              didn't happened (which is not completely wrong...)
            </p>
            <p>
              <strong>TLDR;</strong> This is a bad UX (if you have ideas about how to improve it, you're welcome :-)) but when this banner appears, click the "Reload" button
              and continue browsing normally ... when the SW will be ready to update, it will refresh the page you are currently on and the
              banner will no longer appear.
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
              At the moment, we are a team of frontend developers and designers, both working for the same french company,
              <a href="https://www.4sh.fr" target="_blank">4SH</a>, which helps us by giving some free (day) time in
              addition to our nightly OSS contributions.<br/>
              Project
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
