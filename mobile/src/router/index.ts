import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/event-selector' },
  { name: 'eventSelector', path: '/event-selector', component: () => import(`@/views/EventSelectorPage.vue`) },
  { path: '/events/:eventId', component: () => import('@/views/EventPage.vue'), children: [
    { name: 'rootEventPage', path: '', redirect: (route) => `/events/${route.params.eventId}/schedule` },
    { name: 'eventSchedule', path: 'schedule', component: () => import('@/views/event/SchedulePage.vue') },
    { name: 'eventFavorites', path: 'favorites', component: () => import('@/views/event/FavoritesPage.vue') },
    { name: 'eventFeedbacks', path: 'feedbacks', component: () => import('@/views/event/FeedbacksPage.vue') },
    { name: 'eventNotifications', path: 'notifications', component: () => import('@/views/event/NotificationsPage.vue') },
    { name: 'eventInformations', path: 'infos', component: () => import('@/views/event/InfosPage.vue') },
    { name: 'eventTalkDetails', path: 'talks/:talkId/details', component: () => import('@/views/event/TalkDetailsPage.vue') },
  ]},
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
