import {onMounted, onUnmounted, getCurrentInstance} from "vue";
import {RouteAction, RouteDirection} from "@ionic/vue-router/dist/types/types";
import {useIonRouter} from "@ionic/vue";
import {
    createTypedCustomEventClass,
    TypedCustomEventData,
} from "@/models/utils";
import {goBackOrNavigateTo} from "@/router";
import {getCurrentComponentInstancePath} from "@/views/vue-utils";
import {match, P} from "ts-pattern";


/**
 * This hook main objective is to workaround navigation bug described here :
 * https://github.com/ionic-team/ionic-framework/issues/27443
 *
 * Problem is: when we're using tabs, navigations happening *within* tab views
 * remain in tab views
 * The corollary of this premise is: if we want to navigate to a non-tabbed view from a link
 * located inside a tabbed view, it doesn't work as we would expect (by calling router.navigate())
 * See https://ionicframework.com/docs/vue/navigation#switching-between-tabs
 *
 * Current hook is providing some workaround to trigger tabbed page's router navigations from within
 * a component located inside a tab
 *
 * Given that events don't bubble out of <ion-router-outlet>, it's complicated to make Page declaring <ion-tabs>
 * to be aware of this kind of navigation change.
 * The simplest workaround I found was to trigger a (global) window event from the tabbed view and
 * catch it in the base page to trigger a router.navigate() at its level.
 * => That's the purpose of this hook: providing facilities to communicate from tabbed view to base page
 * to trigger navigations
 *
 * Note also that calling tabbed page's router back() doesn't work when there have been tabbed navigations involved
 * (I assume it has something to do with history.state.position)
 * That's why when a navigation backward is requested at the tabbed page's level, we first need to reset
 * vue router's history position to the original tabbed page's one, THEN perform a back() at ion router's level
 * (see goBackCallback handler implementation)
 */

const TabExitOrNavigateEventName = 'tabbed-page-exit-or-navigate-requested';
const TabExitOrNavigateEvent = createTypedCustomEventClass<{
    onEventCaught?: (() => Promise<void>)|undefined,
    url: string,
    routerDirection?: RouteDirection
}>(TabExitOrNavigateEventName);

const NavigationEventName = 'tabbed-page-navigation-requested'
const NavigationEvent = createTypedCustomEventClass<{
    onEventCaught?: (() => Promise<void>)|undefined,
    url: string,
    routerDirection: RouteDirection,
    routerAction: RouteAction
}>(NavigationEventName)


/**
 * This map allows to declare multiple navigation callback per component 'path'
 * because, for some (unknown) reasons, when we refresh tabbed page (like, event schedule)
 * we have 2 instances of event-tabs component after a tab navigation:
 * - first <event-tabs> instance when loading page
 * - second <event-tabs> instance on first tab switch
 *
 * Note that this behaviour only happens on page load occuring on a tabbed page: when we navigate
 * from event-selector screen, only a single <event-tabs> instance is created
 *
 * I guess this has something to do with _BaseEventPages "parent" route which is instantiated twice
 * instead of once, in case of a parent-child route refresh
 *
 * Map below allows to track callback registrations on a per-component path basis (in duplicated <event-tabs> case
 * described above, we will have a single entry in PER_COMPONENT_PATH_CALLBACKS, with an array of 2 callbacks declared)
 * And when a navigation will be triggered, every callbacks in array will be triggered)
 */
type TabbedPageNavigationCallbacks = {
  navCallback: (event: Event) => Promise<void>,
  tabExitOrNavigateCallback: (event: Event) => Promise<void>,
};
const PER_COMPONENT_PATH_CALLBACKS = new Map<string, TabbedPageNavigationCallbacks[]>();

export function useTabbedPageNav() {
    return {
        triggerTabbedPageNavigate: function(url: string, routerDirection: RouteDirection, routerAction: RouteAction, onEventCaught?: TypedCustomEventData<typeof NavigationEvent>['onEventCaught']|undefined) {
            window.trackTabbedPageNavigationEvent({
              type: 'tabbed-page-custom-dispatch-event:navigation',
              params: { url, routerDirection, routerAction }
            })
            // Using standard event dispatching through ionic's $emit is pointless here, as I didn't find
            // how to bubble these event from <ion-router-outlet> placed into _BaseEventPages
            // => I'm using a crappy global event (type unsafe) hack here
            window.dispatchEvent(new NavigationEvent({
                onEventCaught,
                url, routerDirection, routerAction
            }))
        },
        triggerTabbedPageExitOrNavigate: function(url: string, routerDirection?: RouteDirection, onEventCaught?: TypedCustomEventData<typeof NavigationEvent>['onEventCaught']|undefined) {
            window.trackTabbedPageNavigationEvent({
              type: 'tabbed-page-custom-dispatch-event:tabExitOrNavigate',
              params: { url, routerDirection }
            })
            // Using standard event dispatching through ionic's $emit is pointless here, as I didn't find
            // how to bubble these event from <ion-router-outlet> placed into _BaseEventPages
            // => I'm using a crappy global event (type unsafe) hack here
            window.dispatchEvent(new TabExitOrNavigateEvent({
                onEventCaught,
                url, routerDirection
            }))
        },
        // Please, call this listeners registration whenever you open a page containing tabs, so that
        // tabbed views are able to communicate root-level navigation calls through triggerXXX hooks
        registerTabbedPageNavListeners: function(opts?: { skipNavRegistration: boolean, skipExitOrNavRegistration: boolean }) {
            const { path: currentComponentInstancePath } = getCurrentComponentInstancePath()

            const ionRouter = useIonRouter();
            const startingHistoryPosition = history.state.position;

            window.trackTabbedPageNavigationEvent({
              type: 'tabbed-page-nag-listeners:registration', params: { currentComponentInstancePath, startingHistoryPosition }
            });

            const navCallback = async (event: Event) => {
                const perComponentPathCallbacks = PER_COMPONENT_PATH_CALLBACKS.get(currentComponentInstancePath);
                if(!perComponentPathCallbacks) {
                  window.trackTabbedPageNavigationEvent({
                    type: 'nav-callback:no-op', params: { reason: `no PER_COMPONENT_PATH_CALLBACKS found for path: ${currentComponentInstancePath}` }
                  })
                  return;
                }
                if(perComponentPathCallbacks[perComponentPathCallbacks.length-1].navCallback !== navCallback) {
                  window.trackTabbedPageNavigationEvent({
                    type: 'nav-callback:no-op', params: { reason: `last registered navCallback not matching current navCallback for path: ${currentComponentInstancePath}` }
                  })
                  return;
                }

                if(isNavigationEvent(event)) {
                    if(event.detail.onEventCaught) {
                        await event.detail.onEventCaught();
                    }

                    window.trackTabbedPageNavigationEvent({
                      type: 'ionRouter:navigate', params: event.detail
                    })
                    // This navigate() call will happen inside tabbed page context
                    ionRouter.navigate(event.detail.url, event.detail.routerDirection, event.detail.routerAction);

                    perComponentPathCallbacks.pop();
                    if(perComponentPathCallbacks.length) {
                      window.trackTabbedPageNavigationEvent({
                        type: 'otherNavCallbackDelegation', params: { perComponentPathCallbacksSize: perComponentPathCallbacks.length }
                      })
                      const nextCallback = perComponentPathCallbacks[perComponentPathCallbacks.length-1];
                      await new Promise((resolve) => {
                        setTimeout(async () => {
                          await nextCallback.navCallback(event);
                          resolve(null);
                        }, 0);
                      });
                    } else {
                      PER_COMPONENT_PATH_CALLBACKS.delete(currentComponentInstancePath);
                    }
                } else {
                    throw new Error(`Unexpected event type ${event.type} in tabbed-page-navigation callback registration !`)
                }
            }
            const tabExitOrNavigateCallback = async (event: Event) => {
                const perComponentPathCallbacks = PER_COMPONENT_PATH_CALLBACKS.get(currentComponentInstancePath);
                if(!perComponentPathCallbacks) {
                  window.trackTabbedPageNavigationEvent({
                    type: "tab-exit-or-navigate-callback:no-op", params: { reason: `no PER_COMPONENT_PATH_CALLBACKS found for path: ${currentComponentInstancePath}` }
                  })
                  return;
                }
                if(perComponentPathCallbacks[perComponentPathCallbacks.length-1].tabExitOrNavigateCallback !== tabExitOrNavigateCallback) {
                  window.trackTabbedPageNavigationEvent({
                    type: 'tab-exit-or-navigate-callback:no-op', params: { reason: `last registered tabExitOrNavigateCallback not matching current tabExitOrNavigateCallback for path: ${currentComponentInstancePath}` }
                  })
                  return;
                }

                if(isTabExitOrNavigateEvent(event)) {
                    const routerGoBacks = startingHistoryPosition - history.state.position;

                    window.trackTabbedPageNavigationEvent({
                      type: 'goBackOrNavigateTo', params: {
                        url: event.detail.url, routerGoBacks, startingHistoryPosition,
                        historyPosition: history.state.position, routerDirection: event.detail.routerDirection
                      }
                    })

                    await goBackOrNavigateTo(ionRouter, event.detail.url, routerGoBacks, event.detail.routerDirection, event.detail.onEventCaught);

                    perComponentPathCallbacks.pop();
                    if(perComponentPathCallbacks.length) {
                      window.trackTabbedPageNavigationEvent({
                        type: 'otherNavCallbackDelegation', params: { perComponentPathCallbacksSize: perComponentPathCallbacks.length }
                      })

                      const nextCallback = perComponentPathCallbacks[perComponentPathCallbacks.length-1];
                      await new Promise(async (resolve) => {
                        await nextCallback.tabExitOrNavigateCallback(event);
                        setTimeout(() => resolve(null), 0);
                      });
                    } else {
                      PER_COMPONENT_PATH_CALLBACKS.delete(currentComponentInstancePath);
                    }
                } else {
                    throw new Error(`Unexpected event type ${event.type} in tabbed-page-navigation callback registration !`)
                }
            }

            const componentCallbacks: TabbedPageNavigationCallbacks = { navCallback, tabExitOrNavigateCallback }

            onMounted(() => {
                const perComponentPathCallbacks = match(PER_COMPONENT_PATH_CALLBACKS.get(currentComponentInstancePath))
                  .with(P.nullish, () => {
                    const callbacks: TabbedPageNavigationCallbacks[] = [];
                    PER_COMPONENT_PATH_CALLBACKS.set(currentComponentInstancePath, callbacks);
                    return callbacks;
                  }).otherwise(callbacks => callbacks);

                if(!opts?.skipNavRegistration) {
                    window.addEventListener(NavigationEventName, componentCallbacks.navCallback);
                }
                if(!opts?.skipExitOrNavRegistration) {
                    window.addEventListener(TabExitOrNavigateEventName, componentCallbacks.tabExitOrNavigateCallback);
                }

                perComponentPathCallbacks.push(componentCallbacks);
            })
            onUnmounted(() => {
                const maybePerComponentPathCallbacks = PER_COMPONENT_PATH_CALLBACKS.get(currentComponentInstancePath);
                if(!maybePerComponentPathCallbacks) {
                  return;
                }

                const componentCallbacksIndex = maybePerComponentPathCallbacks.findIndex(callbacks => callbacks === componentCallbacks);
                if(componentCallbacksIndex !== -1) {
                  maybePerComponentPathCallbacks.splice(componentCallbacksIndex, 1);

                  if(!opts?.skipNavRegistration) {
                    window.removeEventListener(NavigationEventName, componentCallbacks.navCallback);
                  }
                  if(!opts?.skipExitOrNavRegistration) {
                    window.removeEventListener(TabExitOrNavigateEventName, componentCallbacks.tabExitOrNavigateCallback);
                  }
                }
                if(maybePerComponentPathCallbacks.length === 0) {
                  PER_COMPONENT_PATH_CALLBACKS.delete(currentComponentInstancePath);
                } else {
                  console.log(`remaining callbacks in component ${currentComponentInstancePath}`)
                }
            })
        }
    }
}

function isNavigationEvent(event: Event): event is InstanceType<typeof NavigationEvent> {
    return event.type === NavigationEventName;
}
function isTabExitOrNavigateEvent(event: Event): event is InstanceType<typeof TabExitOrNavigateEvent> {
    return event.type === TabExitOrNavigateEventName;
}
