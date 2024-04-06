<template>
  <swiper :style="{ '--swiper-navigation-color': '#fff', '--swiper-pagination-color': '#fff', }"
          :zoom="true"
          :navigation="true"
          :pagination="{ clickable: true, }"
          :modules="[Zoom, Pagination, Navigation]"  class="swiper">
    <swiper-slide v-for="(item) in items" :key="item.pictureUrl">
      <div class="swiper-zoom-container">
        <img :src="item.pictureUrl" :alt="item.label" />
      </div>
    </swiper-slide>
  </swiper>
</template>

<script setup lang="ts">
import {Navigation, Pagination, Zoom} from 'swiper/modules';
import {Swiper, SwiperSlide} from "swiper/vue";
import {PropType} from "vue";
import 'swiper/css';
import 'swiper/css/zoom';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const props = defineProps({
    items: {
        required: true,
        type: Array as PropType<Array<{label: string, pictureUrl: string}>>,
    },
})
</script>

<style lang="scss">
.swiper {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  box-shadow: var(--app-shadow-light);

  .callout {
    position: absolute;
    top: 0;
  }

  .swiper-zoom-container {
    border-radius: 12px;
    background: var(--app-white);
    border: 1px solid var(--app-beige-line);

    @media (prefers-color-scheme: dark) {
      background: var(--app-dark-contrast);
    }
  }
}

.swiper-button-prev, .swiper-button-next {
  top: inherit;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 44px;
  width: 44px;
  border-radius: 44px;
  background: var(--app-primary);
  box-shadow: var(--app-shadow-light);

  @media (prefers-color-scheme: dark) {
    background: var(--app-white);
    border: 2px solid var(--app-dark-contrast);
  }

  &:after {
    font-size: 20px !important;
    font-weight: bolder;

    @media (prefers-color-scheme: dark) {
     color: var(--app-primary);
    }
  }

  &.swiper-button-disabled {
    display: none;
  }
}

.swiper-pagination-bullet {
  background: var(--app-beige-dark);

  @media (prefers-color-scheme: dark) {
    background: var(--app-white);
  }
}

.swiper-pagination-bullet-active {
  background: var(--app-primary);

  @media (prefers-color-scheme: dark) {
    background: var(--app-white);
  }
}

</style>
