<template>
  <div style="width: 100%">
    <iframe v-if="representation.type === 'iframe'" type="text/html" :src="representation.url"></iframe>
    <span v-if="representation.type === 'text'">URL: <a :href="representation.url" target="_blank">{{representation.url}}</a></span>
  </div>
</template>

<script setup lang="ts">
import {computed, PropType, toValue} from "vue";
import {RecordingPlatform} from "@shared/daily-schedule.firestore";
import {match, P} from "ts-pattern";

const props = defineProps({
  url: {
    required: true,
    type: String
  },
  platform: {
    required: true,
    type: String as PropType<RecordingPlatform>
  }
})

const representation = computed(() => {
  const platform = toValue(props.platform);
  const url = toValue(props.url);

  return match([url, platform])
    .with([P.string.includes("/watch"), 'youtube'], ([url, _]) => {
      const videoId = url.replace(/^.*v=([^&]+)$/gi, "$1");
      if(!videoId) {
        console.warn(`No video id found in youtube url ${url} !.. Falling back on text representation !`)
        return { type: 'text', url };
      }

      return { type: 'iframe', url: `https://www.youtube.com/embed/${videoId}` }
    }).with([P.string.includes("/embed"), 'youtube'], ([url, _]) => ({ type: 'iframe', url }))
    .with([P.string, 'youtube'], ([url, _]) => ({ type: 'text', url }))
    .with([P.string, 'unknown'], ([url, _]) => ({ type: 'text', url }))
    .exhaustive();
})

</script>

<style lang="scss" scoped>
iframe {
  width: 100%;
  aspect-ratio: 4/3;
  border: 0px;
}
</style>
