import _BaseEventPages from "@/views/event/_BaseEventPages.vue";
import SchedulePage from "@/views/event/SchedulePage.vue";
import FavoritesPage from "@/views/event/FavoritesPage.vue";
import FeedbacksPage from "@/views/event/FeedbacksPage.vue";
import NotificationsPage from "@/views/event/NotificationsPage.vue";
import InfosPage from "@/views/event/InfosPage.vue";
import NewFeedbackPage from '@/views/feedbacks/NewFeedbackPage.vue';
import RateTalkPage from '@/views/feedbacks/RateTalkPage.vue';
import TalkDetailsPage from '@/views/TalkDetailsPage.vue';
import _BaseEventDetailsPages from '@/views/event/details/_BaseEventDetailsPages.vue';
import TalkFeedbacksPage from '@/views/user/TalkFeedbacksPage.vue';
import UserDashboardPage from '@/views/user/UserDashboardPage.vue';
import ViewableTalksHavingFeedbacksPage from '@/views/user/ViewableTalksHavingFeedbacksPage.vue';
import MyGlobalSettingsPage from '@/views/user/MyGlobalSettingsPage.vue';
import MyPersonalDataPage from '@/views/user/MyPersonalDataPage.vue';
import UserTokenRegistrationPage from '@/views/UserTokenRegistrationPage.vue';

const modules = {
    _BaseEventPages,
    SchedulePage,
    FavoritesPage,
    FeedbacksPage,
    NotificationsPage,
    InfosPage,
    NewFeedbackPage,
    RateTalkPage,
    TalkDetailsPage,
    _BaseEventDetailsPages,
    TalkFeedbacksPage,
    UserDashboardPage,
    ViewableTalksHavingFeedbacksPage,
    MyGlobalSettingsPage,
    MyPersonalDataPage,
    UserTokenRegistrationPage,
} as const;

export type PreloadedModules = typeof modules;

export default modules;
