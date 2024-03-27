<template>
  <!-- TODO Dev Btn -->
  <ion-button class="btn-talkFavorite" :class="{'_is-active': false}" fill="clear" :aria-label="LL.Add_Favorites">
           <span class="btn-talkFavorite-group">
              <ion-icon class="btn-talkFavorite-group-icon" v-if="true" aria-hidden="true"
                        src="/assets/icons/line/bookmark-line-favorite.svg"></ion-icon>
              <ion-icon class="btn-talkFavorite-group-icon" v-if="true" aria-hidden="true"
                        src="/assets/icons/solid/bookmark-favorite.svg"></ion-icon>
              <ion-label class="btn-talkFavorite-group-nb" v-if="true">-</ion-label>
           </span>
  </ion-button>
</template>

<script setup lang="ts">
  import {typesafeI18n} from "@/i18n/i18n-vue";
  const { LL } = typesafeI18n()
</script>

<style scoped lang="scss">

.btn-talkFavorite {
  --size: 34px;
  height: 44px;
  width: 44px;

  &._is-active {
    .btn-talkFavorite-group-icon {
      color: var(--voxxrin-event-theme-colors-primary-hex);
    }
  }

  &-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 2px;

    &-icon {
      position: relative;
      font-size: 26px;
    }

    &-nb {
      font-size: 14px !important;
      font-weight: 700;
    }
  }
}
</style>
