<template>
  <swiper :style="{ '--swiper-navigation-color': '#fff', '--swiper-pagination-color': 'var(--app-voxxrin)', }"
          :pagination="{ clickable: true, }"
          :speed="600"
          :parallax="true"
          :modules="[Pagination, Parallax]" class="swiper">

    <div
        slot="container-start"
        class="parallax-bg"
        data-swiper-parallax="-43%"></div>
    <swiper-slide>
      <div class="swiper-slide-content">
        <ion-img :src="'assets/images/svg/illu-list-pinned.svg'"/>
        <ion-text class="title">Pin/Unpin events</ion-text>
        <ion-text>With this function, you have the power to highlight your favorite events and pin them to the
          top of your list. It's a simple and effective way to personalize your experience according to your
          preferences. Try it now and bring your favorite events to life!
        </ion-text>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content">
        <ion-img :src="'assets/images/svg/illu-list-pinned.svg'"/>
        <ion-text class="title">Event's daily schedules</ion-text>
        <ion-text>Get ready for an organized and visually enhanced experience! Talks are grouped by timeslots and talk
          formats, making it easy to plan your agenda. Plus, we've made sure to highlight overlapping timeslots with
          a sleek UI marker, so you never miss a beat.
        </ion-text>
      </div>
    </swiper-slide>
    <swiper-slide>
      <div class="swiper-slide-content">
        <ion-img :src="'assets/images/svg/illu-list-pinned.svg'"/>
        <ion-text class="title">Fav/Unfav talks</ion-text>
        <ion-text>Effortlessly plan your talk schedule and create a personalized program with our dedicated favorites
          screen, designed with a user-friendly interface just for you.
        </ion-text>
      </div>
    </swiper-slide>
  </swiper>
</template>

<script setup lang="ts">
import {Pagination, Parallax} from 'swiper/modules';
  import {Swiper, SwiperSlide} from "swiper/vue";
  import 'swiper/css';
  import 'swiper/css/pagination';
</script>

<style lang="scss" scoped>
  .swiper {
    position: relative;
    height: 100%;
    background: var(--app-background);
    background-image: url('../../../assets/images/png/grid-patern.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    --swiper-pagination-bottom: 74px;
    --swiper-pagination-bullet-size: 10px;
    --swiper-pagination-bullet-inactive-color: var(--app-beige-dark);
  }

  .swiper-pagination-bullets.swiper-pagination-horizontal {
    width: inherit !important;
  }

  .swiper-slide {
    position: relative;
    text-align: center;
    font-size: 18px;
    background: transparent;
    height: 100%;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(2px);

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

    &-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      max-width: 440px;
      margin: 16px;
      padding: 24px;
      background: rgb(255 255 255 / 50%);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      border-radius: 24px;

      @media (prefers-color-scheme: dark) {
        background: rgba(var(--app-medium-contrast-rgb), 0.7);
        -webkit-backdrop-filter: blur(2em);
        backdrop-filter: blur(2em);
      }

      ion-img {
        width: 60%;
        max-height: 450px;
      }

      .title {
        display: block;
        margin: 24px 0;
        font-size: 24px;
        font-weight: bold;
        line-height: 1;
      }

      ion-text {
        font-size: 16px;
      }
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
      opacity: 0.5;
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
      opacity: 0.5;
      background-image: url('../../../assets/images/png/blur-circle-gradient.png');
      z-index: -1;
      content: '';
      pointer-events: none;
    }
  }
</style>
