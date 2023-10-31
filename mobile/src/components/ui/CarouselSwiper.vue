<template>
  <swiper :style="{ '--swiper-navigation-color': '#fff', '--swiper-pagination-color': '#fff', }"
          :zoom="true" :navigation="true" :pagination="{ clickable: true, }"
          :modules="[Zoom, Pagination, Navigation]" class="swiper">
    <swiper-slide v-for="(item) in items" :key="item.pictureUrl">
      <div class="swiper-zoom-container">
        <img :src="item.pictureUrl" :alt="item.label" />
      </div>
    </swiper-slide>
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

<style lang="scss" scoped>
.swiper {
  width: 100%;
  height: 500px;
}
</style>
