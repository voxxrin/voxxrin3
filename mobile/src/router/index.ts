import { createRouter, createWebHistory } from '@ionic/vue-router';
import {RouteLocation, RouteRecordRaw} from 'vue-router';
import EventSelectorPage from "@/views/EventSelectorPage.vue";
import {UseIonRouterResult} from "@ionic/vue";
import {RouteDirection} from "@ionic/vue/dist/types/hooks/router";
import type {PreloadedModules} from './preloaded-pages'
import type {PreloadedAdminModules} from './preloaded-admin-pages'

async function preloadedPage<M extends keyof PreloadedModules>(moduleName: M): Promise<PreloadedModules[M]> {
  const modules = await import('./preloaded-pages')
  return modules.default[moduleName];
}
async function preloadedAdminPage<M extends keyof PreloadedAdminModules>(moduleName: M): Promise<PreloadedAdminModules[M]> {
  const modules = await import('./preloaded-admin-pages')
  return modules.default[moduleName];
}

const SPACES = [
  {pathPrefix: '', resolvedPathPrefix: (route: RouteLocation) => ``},
  {pathPrefix: '/spaces/:spaceId', resolvedPathPrefix: (route: RouteLocation) => `/spaces/${route.params.spaceId}`},
] as const

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/event-selector' },
  { path: '/index.html', redirect: '/event-selector' },
  { path: '/event-selector', component: EventSelectorPage },
  ...SPACES.flatMap(space => [
    { path: `${space.pathPrefix}/events/:eventId`, component: () => preloadedPage('_BaseEventPages'), children: [
        { path: '', redirect: (route: RouteLocation) => `${space.resolvedPathPrefix(route)}/events/${route.params.eventId}/schedule` },
        { path: 'schedule', component: () => preloadedPage('SchedulePage') },
        { path: 'favorites', component: () => preloadedPage('FavoritesPage') },
        { path: 'feedbacks', component: () => preloadedPage('FeedbacksPage') },
        { path: 'notifications', component: () => preloadedPage('NotificationsPage') },
        { path: 'infos', component: () => preloadedPage('InfosPage') },
      ]},
    { path: `${space.pathPrefix}/events/:eventId/embedded-schedule`, component: () => import('@/views/event/EmbeddedSchedulePage.vue') },
    { path: `${space.pathPrefix}/events/:eventId/new-feedback-for-timeslot/:timeslotId`, component: () => preloadedPage('NewFeedbackPage') },
    { path: `${space.pathPrefix}/events/:eventId/rate-talk/:talkId`, component: () => preloadedPage('RateTalkPage') },
    { path: `${space.pathPrefix}/events/:eventId/talks/:talkId/details`, component: () => preloadedPage('TalkDetailsPage') },
    { path: `${space.pathPrefix}/events/:eventId/talks/:talkId/asFeedbackViewer/:secretFeedbacksViewerToken`, component: () => preloadedPage('_BaseEventDetailsPages'), children: [
        { path: '', redirect: (route: RouteLocation) => `${space.resolvedPathPrefix(route)}/events/${route.params.eventId}/talks/${route.params.talkId}/asFeedbackViewer/${route.params.secretFeedbacksViewerToken}/details` },
        { path: 'details', component: () => preloadedPage('TalkDetailsPage') },
        { path: 'feedbacks', component: () => preloadedPage('TalkFeedbacksPage') },
      ]},
    { path: `${space.pathPrefix}/events/:eventId/asOrganizer/:secretOrganizerToken`, component: () => preloadedAdminPage('_BaseEventAdminPages'), children: [
        { path: '', redirect: (route: RouteLocation) => `${space.resolvedPathPrefix(route)}/events/${route.params.eventId}/asOrganizer/${route.params.secretOrganizerToken}/config` },
        { path: 'config', component: () => preloadedAdminPage('EventAdminConfiguration') },
        { path: 'talks-config', component: () => preloadedAdminPage('EventAdminTalksConfiguration') },
      ]},
    { path: `${space.pathPrefix}/events/:eventId/asOrganizer/:secretOrganizerToken/talk-feedbacks/:talkId`, component: () => preloadedAdminPage('EventAdminTalkFeedbacks') },
  ]),
  { path: '/faq', component: () => preloadedPage('FAQPage') },
  { path: '/user/dashboard', component: () => preloadedPage('UserDashboardPage') },
  { path: '/user/talks', component: () => preloadedPage('ViewableTalksHavingFeedbacksPage') },
  ...SPACES.flatMap(space => [
    { path: `/user${space.pathPrefix}/events/:eventId/talks/:talkId/asFeedbackViewer/:secretFeedbacksViewerToken`, component: () => preloadedPage('TalkFeedbacksPage') },
  ]),
  { path: '/user/my-global-settings', component: () => preloadedPage('MyGlobalSettingsPage') },
  { path: '/user/my-personal-data', component: () => preloadedPage('MyPersonalDataPage') },
  { path: '/user-tokens/register', component: () => preloadedPage('UserTokenRegistrationPage') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

/**
 * Sometimes, it's not possible to call ionRouter.back() because, for some reasons (for instance, we
 * hit browser refresh button) it won't work properly
 *
 * Worst: in this situation, ionRouter.back() will work properly (due to some ionic magic) BUT I guess
 * that ionic history will be set as kind of "negative", which will lead to a navigation error if you
 * try to re-navigate to initial page after a ionRouter.back()
 * For instance:
 * - open talk detail page
 * - hit refresh button so that your initial page is on talk detail page
 * - hit close button on the talk detail page: you should be redirected on your previous page
 *   (let's say, event's schedule)
 * - If you try to open again the same talk detail page, even though browser URL will switch to the proper
 *   page, you will remain on the schedule page.
 * => I assume this is due to a "ionic negative navigation history offset"
 *
 * This function is intended to workaround this problem:
 * - It checks if goBack can be issued (through ionRouter.canGoBack()) :
 *   - If this is possible, then a ionRouter.back() will be performed
 *     (after some vue-router's back() magic: if you want further explanation on the why, look at useTabbedPageNav hook)
 *   - If this is not possible, then a navigation on fallback url will replace actual history state
 */
export async function goBackOrNavigateTo(ionRouter: UseIonRouterResult, fallbackUrl: string, routerGoBacks: number = 0, routeDirection: RouteDirection = 'back', onEventCaught: (() => Promise<void>)|undefined = undefined) {
  if(onEventCaught) {
    await onEventCaught();
  }

  // Regular case: we opened a tabbed context from an initial page (example: event listing)
  // => we will "go back" to this initial page by "reversing" ionic flow used to navigate to
  // current tabbed page
  if(ionRouter.canGoBack()) {
    // This back() call will happen inside tabbed page context
    //
    // Note that calling tabbed page's router back() doesn't work when there have been tabbed navigations involved
    // (I assume it has something to do with history.state.position)
    // That's why when a navigation backward is requested at the tabbed page's level, we first need to reset
    // vue router's history position to the original tabbed page's one, THEN perform a back() at ion router's level
    if(routerGoBacks!==0){
      router.go(routerGoBacks>0?-routerGoBacks:routerGoBacks)
    }
    ionRouter.back();

  // Sometimes, we might be on a tabbed page without having navigated from another context
  // Typical case: if we "refresh" the page on the schedule page, canGoBack() will return false
  // because ionic doesn't have into its (memory) history the previous page we would like to navigate to
  // => in that case, we'll have to "replace" current history by this initial page that will have to be explicitely
  // provided to the event definition
  } else {
    // This navigate() call will happen inside tabbed page context
    ionRouter.navigate(fallbackUrl, routeDirection, "replace");
  }
}
