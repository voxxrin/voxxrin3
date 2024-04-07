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
  padding-bottom: 38px;
  border-radius: 12px;
  border: 1px solid var(--app-beige-line);
  background: var(--app-grey-light);
  box-shadow: var(--app-shadow-light);

  @media (prefers-color-scheme: dark) {
    background: var(--app-dark-contrast);
  }

  .callout {
    position: absolute;
    top: 0;
  }

  .swiper-zoom-container {
    border-radius: 12px 12px 0 0;
  }
}

.swiper-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  bottom: 0 !important;
  height: 38px;
  background: var(--app-white);
  box-shadow: rgba(0, 0, 0, 0.24) 0 3px 8px;
  border: none !important;
  z-index: 0;

  @media (prefers-color-scheme: dark) {
    background: var(--app-light-contrast);
    border: 4px solid var(--app-dark-contrast);
  }
}

.swiper-button-prev, .swiper-button-next {
  top: inherit;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 48px;
  width: 48px;
  border-radius: 44px;
  background: var(--app-primary);
  border: 4px solid var(--app-white);

  @media (prefers-color-scheme: dark) {
    background: var(--app-white);
    border: 4px solid var(--app-light-contrast);
  }

  &:active {
    transition: 140ms ease-in-out;
    transform: scale(0.94) !important;
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
