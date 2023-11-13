<template>
  <swiper :style="{ '--swiper-navigation-color': '#fff', '--swiper-pagination-color': 'var(--app-voxxrin)', }"
          :pagination="{ clickable: true, dynamicBullets: true }"
          :speed="800"
          :navigation="{ nextEl: '.buttonNext',  prevEl: '.buttonPrev'}"
          :parallax="true"
          :modules="[Pagination, Parallax, Navigation]" class="swiper">
    <!-- TODO - #45 Connect btn for close modal -->
    <ion-button fill="outline" color="secondary" class="skipBtn" size="default">
      Skip
    </ion-button>
    <div
        slot="container-start"
        class="parallax-bg"
        data-swiper-parallax="-43%"></div>
    <swiper-slide>
      <div class="swiper-slide-content" data-swiper-parallax-scale="0.7">
        <ion-img :src="'assets/images/png/demo-pin.png'" data-swiper-parallax-y="-15%" data-swiper-parallax-x="-15%"/>
        <div class="description"
             data-swiper-parallax-y="8%"
             data-swiper-parallax-opacity="0">
          <ion-text class="title">Pin/Unpin events</ion-text>
          <ion-text>With this function, you have the power to highlight your favorite events and pin them to the
            top of your list. It's a simple and effective way to personalize your experience according to your
            preferences. Try it now and bring your favorite events to life!
          </ion-text>
        </div>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content" data-swiper-parallax-scale="0.7">
        <ion-img :src="'assets/images/png/demo-schedules.png'" data-swiper-parallax-y="-15%" data-swiper-parallax-x="-15%"/>
        <div class="description"
             data-swiper-parallax-y="8%"
             data-swiper-parallax-opacity="0">
          <ion-text class="title">Event's daily schedules</ion-text>
          <ion-text>Get ready for an organized and visually enhanced experience! Talks are grouped by timeslots and talk
            formats, making it easy to plan your agenda. Plus, we've made sure to highlight overlapping timeslots with
            a sleek UI marker, so you never miss a beat.
          </ion-text>
        </div>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content" data-swiper-parallax-scale="0.7">
        <ion-img :src="'assets/images/png/demo-fav.png'" data-swiper-parallax-y="-15%" data-swiper-parallax-x="-15%"/>
        <div class="description"
             data-swiper-parallax-y="8%"
             data-swiper-parallax-opacity="0">
          <ion-text class="title">Fav/Unfav talks</ion-text>
          <ion-text>Unlock the power to rate talks (when enabled by the organizer). Ongoing and past talks are up
            for evaluation, with various rating options. Plus, explore your conference feedback in a dedicated tab.
          </ion-text>
        </div>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content" data-swiper-parallax-scale="0.7">
        <ion-img :src="'assets/images/png/demo-feedbacks.png'" data-swiper-parallax-y="-15%" data-swiper-parallax-x="-15%"/>
        <div class="description"
             data-swiper-parallax-y="8%"
             data-swiper-parallax-opacity="0">
          <ion-text class="title">Rate talks</ion-text>
          <ion-text>Unlock the power to rate talks (when enabled by the organizer). Ongoing and past talks are up
            for evaluation, with various rating options. Plus, explore your conference feedback in a dedicated tab.
          </ion-text>
        </div>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content" data-swiper-parallax-scale="0.7">
        <ion-img :src="'assets/images/png/demo-watch-later.png'" data-swiper-parallax-y="-15%" data-swiper-parallax-x="-15%"/>
        <div class="description"
             data-swiper-parallax-y="8%"
             data-swiper-parallax-opacity="0">
          <ion-text class="title">To watch later</ion-text>
          <ion-text>Discover the 'Watch Later' feature, available when enabled by your conference organizer.
            Mark talks for future viewing and get notified when they're ready. Ideal for those tough choices between
            favorited talks during a time slot or for remote attendees planning their watchlist.
          </ion-text>
          <!-- TODO - #45 Connect for close modal -->
          <ion-button class="buttonFinish" color="secondary" expand="block">OK, let's go!</ion-button>
        </div>
      </div>
    </swiper-slide>
    <div class="swiper-footer">
      <ion-button class="buttonPrev" @click="goToPrevSlide">
        <ion-icon :icon="arrowBack" slot="start"></ion-icon>prev
      </ion-button>
      <ion-button class="buttonNext"  @click="goToNextSlide">
        next<ion-icon :icon="arrowForward" slot="end"></ion-icon>
      </ion-button>
    </div>
  </swiper>
</template>

<script setup lang="ts">
  import {Pagination, Parallax, Navigation} from 'swiper/modules';
  import {Swiper, SwiperSlide} from "swiper/vue";
  import 'swiper/css';
  import 'swiper/css/pagination';
  import 'swiper/css/navigation';
  import {arrowBack, arrowForward} from "ionicons/icons";
</script>

<style lang="scss" scoped>

  .skipBtn {
    position: absolute;
    top: 24px;
    right: 26px;
    z-index: 999;
    --border-width: 1px;
    backdrop-filter: blur(4px);
    border-radius: 44px;
    overflow: hidden;
  }

  .swiper {
    position: relative;
    height: 100%;
    background: var(--app-background);
    background-image: url('../../../assets/images/png/grid-patern.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    --swiper-pagination-bottom: 54px;
    --swiper-pagination-bullet-size: 10px;
    --swiper-pagination-bullet-inactive-color: var(--app-beige-dark);

    &:before  {
      position: absolute;
      height: 100%;
      width: 100%;
      background-image: url('../../../assets/images/png/grain-patern.png');
      background-repeat: repeat-x;
      mix-blend-mode: luminosity;
      opacity: 0.05;
      object-fit: cover;
      z-index: 2;
      content: '';
      pointer-events: none;
    }
  }

  .swiper-slide {
    position: relative;
    text-align: center;
    font-size: 18px;
    background: transparent;
    height: 100%;
    align-items: center;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(2px);

    &-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      max-height: calc(100vh - 34px);
      margin: 16px;
      padding: 24px 24px 74px 24px;
      background: rgb(255 255 255 / 50%);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      border-radius: 24px;
      overflow-y: auto;
      overflow-x: hidden;

      @media (prefers-color-scheme: dark) {
        background: rgba(var(--app-medium-contrast-rgb), 0.7);
        -webkit-backdrop-filter: blur(2em);
        backdrop-filter: blur(2em);
      }

      .description {
        flex: 1;
      }

      ion-img {
        margin-top: 44px;
        max-height: 450px;
      }

      .title {
        display: block;
        max-width: inherit;
        margin: 24px 0;
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
      }

      ion-text {
        display: block;
        font-size: 16px;
        max-width: 554px;
        text-align: center;
      }
    }
  }

  .swiper-footer {
    position: absolute;
    bottom: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 0 24px 28px 24px;
    margin: 0 auto;
    z-index: 1;

    .swiper-button-disabled {
     opacity: 0;
    }
  }

  .parallax-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 130%;
    height: 100%;
    -webkit-background-size: cover;
    background-size: cover;
    background-position: center;

    &:before  {
      position: absolute;
      bottom: -200px;
      right: -100px;
      height: 400px;
      width: 400px;
      opacity: 0.2;
      background-image: url('../../../assets/images/png/blur-circle-gradient.png');
      z-index: -1;
      content: '';
      pointer-events: none;
    }

    &:after  {
      position: absolute;
      top: -200px;
      left: -100px;
      height: 400px;
      width: 400px;
      opacity: 0.2;
      background-image: url('../../../assets/images/png/blur-circle-gradient.png');
      z-index: -1;
      content: '';
      pointer-events: none;
    }
  }

  .buttonFinish {
    margin-top: 44px;
  }
</style>
