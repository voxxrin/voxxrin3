<template>
  <img :src="confDescriptor.backgroundUrl">
  <span class="schedule-talk-event-title">{{confDescriptor.headingTitle}}</span>

  <schedule-talk v-for="(talk, index) in talks" :key="talk.id.value"
                 :conf-descriptor="confDescriptor" :is-highlighted="() => false"
                 :talk="talk"
                 :talk-notes="userEventTalkNotesRef.get(talk.id.value)"
                 @click="emits('talk-clicked', talk)">
    <template #upper-right="{ talk }">
      {{confDescriptor.headingTitle}}
    </template>
    <template #footer-actions="{ talk }">
    </template>
  </schedule-talk>
</template>

<script setup lang="ts">
import ScheduleTalk from "@/components/talk-card/ScheduleTalk.vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import {PropType} from "vue/dist/vue";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
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

const eventIdRef = toRef(() => props.confDescriptor?.id)
const talksIdsRef = toRef(() => (props.talks || []).map(talk => talk.id));

const {userEventTalkNotesRef} = useUserEventTalkNotes(eventIdRef, talksIdsRef)

</script>

<style lang="scss" scoped>

</style>
