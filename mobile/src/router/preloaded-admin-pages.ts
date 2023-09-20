import _BaseEventAdminPages from '@/views/event-admin/_BaseEventAdminPages.vue';
import EventAdminConfiguration from '@/views/event-admin/EventAdminConfiguration.vue';
import EventAdminTalksConfiguration from '@/views/event-admin/EventAdminTalksConfiguration.vue';
import EventAdminTalkFeedbacks from '@/views/event-admin/EventAdminTalkFeedbacks.vue';

const modules = {
    _BaseEventAdminPages,
    EventAdminConfiguration,
    EventAdminTalksConfiguration,
    EventAdminTalkFeedbacks,
} as const;

export type PreloadedAdminModules = typeof modules;

export default modules;
