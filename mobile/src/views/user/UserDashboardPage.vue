<template>
  <ion-page>
    <ion-content class="userDashboard">
      <ion-header class="stickyHeader">
        <ion-toolbar>
          <ion-button class="stickyHeader-close" shape="round" slot="start" size="small" fill="outline"
                      @click="goBackOrNavigateTo(ionRouter, `/event-selector`)"
                      :aria-label="LL.Close()">
            <ion-icon src="/assets/icons/solid/close.svg"></ion-icon>
          </ion-button>
          <ion-title class="stickyHeader-title" slot="start">{{ LL.Profile() }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="userDashboard-user">
        <div class="userDashboard-user-icon">
          <ion-icon src="/assets/icons/line/user-line.svg"></ion-icon>
        </div>
        <div class="userDashboard-user-infos">
          <strong>{{ LL.Anonymous_private_user_id() }}:</strong><br/>
          <span class="userUid">{{currentUserRef?.uid}}</span><br/>
          <small>{{LL.Please_keep_this_token_private()}}</small><br/>
          <hr/>
          <strong>{{ LL.Public_user_id() }}:</strong><br/>
          <span class="userUid">{{userTokensWalletRef?.publicUserToken}}</span><br/>
          <small>{{LL.This_token_will_be_used_to_reference_you_in_APIs()}}</small><br/>
        </div>
      </div>

      <callout title="Anonymous authentication only" type="info">
        <p>
          At the moment, <strong>no federated authentication</strong> (Google, Github, Apple, Twitter...) has been implemented yet.
        </p>
        <p>
          It means you won't be able to <strong>share your schedule</strong> between your devices at the moment.
        </p>
        <p>
          An <strong>import/export feature</strong> is being implemented, but is not available yet.
        </p>
      </callout>

      <div class="userDashboard-content">
        <div class="listCardButton">
          <ion-button class="listCardButton-item" @click="ionRouter.push(`/user/talks`)" :disabled="!isMyTalksButtonEnabled">
            <div class="listCardButton-item-icon">
              <ion-icon src="/assets/icons/solid/comments-2.svg"></ion-icon>
            </div>
            <div class="listCardButton-item-text">
              <span class="titleItem">{{ LL.My_talks_with_Feedbacks() }}</span>
            </div>
            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>
          </ion-button>
<!--          <ion-button class="listCardButton-item" @click="ionRouter.push(`/user/my-global-settings`)">-->
<!--            <div class="listCardButton-item-icon">-->
<!--              <ion-icon src="/assets/icons/solid/settings-cog.svg"></ion-icon>-->
<!--            </div>-->
<!--            <div class="listCardButton-item-text">-->
<!--              <span class="titleItem">{{ LL.App_settings() }}</span>-->
<!--              <small class="subTitleItem">{{ LL.Configure_my_preferences_app() }}</small>-->
<!--            </div>-->
<!--            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>-->
<!--          </ion-button>-->
<!--          <ion-button class="listCardButton-item" @click="$router.push(`/user/my-personal-data`)">-->
<!--            <div class="listCardButton-item-icon">-->
<!--              <ion-icon src="/assets/icons/solid/data.svg"></ion-icon>-->
<!--            </div>-->
<!--            <div class="listCardButton-item-text">-->
<!--              <span class="titleItem">My personal data</span>-->
<!--              <small class="subTitleItem">Import, Export or delete my data</small>-->
<!--            </div>-->
<!--            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>-->
<!--          </ion-button>-->
          <ion-button class="listCardButton-item" @click="ionRouter.push(`/faq`)">
            <div class="listCardButton-item-icon">
              <ion-icon :icon="helpCircle"></ion-icon>
            </div>
            <div class="listCardButton-item-text">
              <span class="titleItem">{{ LL.Frequently_asked_questions() }}</span>
              <small class="subTitleItem">{{ LL.How_and_where_can_I_contact_the_team() }}</small>
            </div>
            <ion-icon class="listCardButton-item-nav" src="/assets/icons/line/chevron-right-line.svg"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>
<!--    <ion-footer class="userDashboardFooter">-->
<!--      <ion-toolbar>-->
<!--        <ion-button fill="outline" size="default" expand="block">-->
<!--          {{ LL.Logout() }}-->
<!--          <ion-icon src="/assets/icons/line/logout-half-circle-line.svg"></ion-icon>-->
<!--        </ion-button>-->
<!--      </ion-toolbar>-->
<!--    </ion-footer>-->
  </ion-page>
</template>

<script setup lang="ts">

import {useIonRouter} from "@ionic/vue";
import {useCurrentUser} from "@/state/useCurrentUser";
import Callout from "@/components/ui/Callout.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {computed, toValue} from "vue";
import {useUserTokensWallet} from "@/state/useUserTokensWallet";
import {goBackOrNavigateTo} from "@/router";
import {helpCircle} from "ionicons/icons";

const ionRouter = useIonRouter();

const currentUserRef = useCurrentUser();
const { LL } = typesafeI18n()

const { userTokensWalletRef } = useUserTokensWallet();

const isMyTalksButtonEnabled = computed(() => {
  const userTokensWallet = toValue(userTokensWalletRef);
  if(!userTokensWallet) {
    return false;
  }

  return userTokensWallet.secretTokens.talkFeedbacksViewerTokens.length > 0;
})
</script>

<style lang="scss" scoped>
  .userDashboard {
    &-user {
      display: flex;
      align-items: center;
      column-gap: 16px;
      padding: var(--app-gutters);
      padding-bottom: 0;

      &-infos {
        .userUid {
          font-size: 14px;
        }

        small {
          color: var(--app-voxxrin);
        }
      }

      &-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 54px;
        width: 54px;
        border-radius: 44px;
        font-size: 28px;
        background: var(--app-voxxrin);
        color: var(--app-white);
      }
    }

    &-content {
      padding: var(--app-gutters);
    }
  }

  .userDashboardFooter {
    --ion-toolbar-background: var(--app-background);

    &::before  {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: -20px !important;
      height: 20px;
      pointer-events: none;
    }

    &::before {
      top: 0;
      background: linear-gradient(to bottom, transparent, var(--app-background));
    }


    ion-toolbar {
      --padding-bottom: 12px;
      --padding-top: 12px;
      --padding-end: 16px;
      --padding-start: 16px;
      --border-width: 0;
    }
  }
</style>
