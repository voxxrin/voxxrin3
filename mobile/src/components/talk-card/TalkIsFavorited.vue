<template>
  <div class="talkFavorite" v-if="talkNotes.isFavorite">
    <ion-icon src="/assets/icons/solid/bookmark-favorite.svg" />
    {{ LL.In_favorites() }}
  </div>
</template>

<script setup lang="ts">
import {PropType, Ref} from "vue";
import {TalkNote} from "../../../../shared/feedbacks.firestore";
import {typesafeI18n} from "@/i18n/i18n-vue";

const { LL } = typesafeI18n()

const props = defineProps({
    talkNotes: {
        required: true,
        type: Object as PropType<TalkNote>
    }
})
const a = ""
</script>

<style lang="scss" scoped>
.talkFavorite {
  display: flex;
  justify-content: center;
  column-gap: 4px;
  color: var(--voxxrin-event-theme-colors-primary-hex);
  font-weight: bold;

  ion-icon { font-size: 18px;}
}
</style>
