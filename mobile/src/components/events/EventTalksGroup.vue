<template>
  <img
    :src="!confDescriptor.theming.headingSrcSet?.length && confDescriptor.backgroundUrl ? confDescriptor.backgroundUrl : ''"
    :srcset="confDescriptor.theming.headingSrcSet?.length ? confDescriptor.theming.headingSrcSet.map(entry => `${entry.url} ${entry.descriptor}`).join(', ') : ''"
  />
  <span class="schedule-talk-event-title">{{confDescriptor.headingTitle}}</span>

  <talk-card v-for="(talk, index) in talks" :key="talk.id.value"
                 :conf-descriptor="confDescriptor" :is-highlighted="() => false"
                 :talk="talk" :room-id="talk.room?.id"
                 :talk-notes="userEventTalkNotesRef.get(talk.id.value)"
                 @click="emits('talk-clicked', talk)"
                 scope="event-talks">
    <template #upper-right="{  }">
      {{confDescriptor.headingTitle}}
    </template>
    <template #footer-actions="{ talk }">
    </template>
  </talk-card>
</template>

<script setup lang="ts">
import TalkCard from "@/components/talk-card/TalkCard.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {PropType} from "vue";
import {spacedEventIdOf, VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {VoxxrinTalk} from "@/models/VoxxrinTalk";
import {toManagedRef as toRef} from "@/views/vue-utils";
import {useUserEventTalkNotes} from "@/state/useUserTalkNotes";

const { LL } = typesafeI18n()

const props = defineProps({
    confDescriptor: {
        required: true,
        type: Object as PropType<VoxxrinConferenceDescriptor>
    },
    talks: {
        required: true,
        type: Object as PropType<VoxxrinTalk[]>
    },
})

const emits = defineEmits<{
    (e: 'talk-clicked', talk: VoxxrinTalk): void,
}>()

const spacedEventIdRef = toRef(() => spacedEventIdOf(props.confDescriptor))
const talksIdsRef = toRef(() => (props.talks || []).map(talk => talk.id));

const {userEventTalkNotesRef} = useUserEventTalkNotes(spacedEventIdRef, talksIdsRef)

</script>

<style lang="scss" scoped>
  img {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    height: 100%;
    width: 100%;
    z-index: -1;
    object-fit: cover;
    border-radius: 16px;
  }

  .schedule-talk-event-title {
    padding: 16px 12px;
    font-size: 18px;
    font-weight: bold;
    color: var(--app-white);
  }
</style>
