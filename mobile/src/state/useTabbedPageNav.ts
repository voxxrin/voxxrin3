import {onMounted, onUnmounted} from "vue";
import {RouteAction, RouteDirection} from "@ionic/vue-router/dist/types/types";
import {useIonRouter} from "@ionic/vue";
import {
    createTypedCustomEventClass,
    TypedCustomEventData,
} from "@/models/utils";
import {useRouter} from "vue-router";
import {goBackOrNavigateTo} from "@/router";


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



export function useTabbedPageNav() {
    return {
        triggerTabbedPageNavigate: function(url: string, routerDirection: RouteDirection, routerAction: RouteAction, onEventCaught?: TypedCustomEventData<typeof NavigationEvent>['onEventCaught']|undefined) {
            // Using standard event dispatching through ionic's $emit is pointless here, as I didn't find
            // how to bubble these event from <ion-router-outlet> placed into _BaseEventPages
            // => I'm using a crappy global event (type unsafe) hack here
            window.dispatchEvent(new NavigationEvent({
                onEventCaught,
                url, routerDirection, routerAction
            }))
        },
        triggerTabbedPageExitOrNavigate: function(url: string, routerDirection?: RouteDirection, onEventCaught?: TypedCustomEventData<typeof NavigationEvent>['onEventCaught']|undefined) {
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
            const ionRouter = useIonRouter();
            const startingHistoryPosition = history.state.position;

            const navCallback = async (event: Event) => {
                if(isNavigationEvent(event)) {
                    if(event.detail.onEventCaught) {
                        await event.detail.onEventCaught();
                    }

                    // This navigate() call will happen inside tabbed page context
                    ionRouter.navigate(event.detail.url, event.detail.routerDirection, event.detail.routerAction);
                } else {
                    throw new Error(`Unexpected event type ${event.type} in tabbed-page-navigation callback registration !`)
                }
            }
            const tabExitOrNavigateCallback = async (event: Event) => {
                if(isTabExitOrNavigateEvent(event)) {
                    const routerGoBacks = startingHistoryPosition - history.state.position;
                    await goBackOrNavigateTo(ionRouter, event.detail.url, routerGoBacks, event.detail.routerDirection, event.detail.onEventCaught);
                } else {
                    throw new Error(`Unexpected event type ${event.type} in tabbed-page-navigation callback registration !`)
                }
            }

            onMounted(() => {
                if(!opts?.skipNavRegistration) {
                    window.addEventListener(NavigationEventName, navCallback);
                }
                if(!opts?.skipExitOrNavRegistration) {
                    window.addEventListener(TabExitOrNavigateEventName, tabExitOrNavigateCallback);
                }
            })
            onUnmounted(() => {
                if(!opts?.skipNavRegistration) {
                    window.removeEventListener(NavigationEventName, navCallback);
                }
                if(!opts?.skipExitOrNavRegistration) {
                    window.removeEventListener(TabExitOrNavigateEventName, tabExitOrNavigateCallback);
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
