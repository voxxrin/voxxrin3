import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import EventSelectorPage from "@/views/EventSelectorPage.vue";

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/event-selector' },
  { path: '/index.html', redirect: '/event-selector' },
  { path: '/event-selector', component: EventSelectorPage },
  { path: '/events/:eventId', component: () => import('@/views/event/_BaseEventPages.vue'), children: [
    { path: '', redirect: (route) => `/events/${route.params.eventId}/schedule` },
    { path: 'schedule', component: () => import('@/views/event/SchedulePage.vue') },
    { path: 'favorites', component: () => import('@/views/event/FavoritesPage.vue') },
    { path: 'feedbacks', component: () => import('@/views/event/FeedbacksPage.vue') },
    { path: 'notifications', component: () => import('@/views/event/NotificationsPage.vue') },
    { path: 'infos', component: () => import('@/views/event/InfosPage.vue') },
  ]},
  { path: '/events/:eventId/new-feedback-for-timeslot/:timeslotId', component: () => import('@/views/feedbacks/NewFeedbackPage.vue') },
  { path: '/events/:eventId/rate-talk/:talkId', component: () => import('@/views/feedbacks/RateTalkPage.vue') },
  { path: '/events/:eventId/talks/:talkId/details', component: () => import('@/views/TalkDetailsPage.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
