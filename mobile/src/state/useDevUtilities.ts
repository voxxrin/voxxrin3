import {
    Clock,
    FixedTimeClock,
    overrideCurrentClock,
    ShiftedTimeClock
} from "@/state/useCurrentClock";
import {ISODatetime} from "../../../shared/type-utils";
import {Temporal} from "temporal-polyfill";
import {match, P} from "ts-pattern";
import {VoxxrinConferenceDescriptor} from "@/models/VoxxrinConferenceDescriptor";
import {getCurrentComponentInstancePath, managedRef as ref} from "@/views/vue-utils";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {Ref} from "vue";
import {updateLogConfigTo} from "@/services/Logger";
import router from "@/router";
import {useIonRouter} from "@ionic/vue";
import {RouteAction, RouteDirection} from "@ionic/vue-router/dist/types/types";


// if(import.meta.env.DEV) {
// May be useful for debug purposes

type OverridableListableEventProperties = {eventId: string} & Partial<Pick<ListableVoxxrinEvent, "theming"|"location"|"backgroundUrl"|"logoUrl">>;
type OverridableEventDescriptorProperties = {eventId: string} & Partial<Pick<VoxxrinConferenceDescriptor, "headingTitle"|"headingSubTitle"|"theming"|"features"|"infos"|"location"|"backgroundUrl"|"logoUrl">>;

let overridenListableEventPropertiesRef: Ref<OverridableListableEventProperties|undefined>|undefined = undefined
let overridenEventDescriptorPropertiesRef: Ref<OverridableEventDescriptorProperties|undefined>|undefined = undefined

export function useOverridenListableEventProperties(){ return overridenListableEventPropertiesRef; }
export function useOverridenEventDescriptorProperties() { return overridenEventDescriptorPropertiesRef; }

export type TabbedPageNavigationEvent =
  | { type: 'tabbed-page-custom-dispatch-event:navigation', params: { url: string, routerDirection: RouteDirection, routerAction: RouteAction } }
  | { type: 'tabbed-page-custom-dispatch-event:tabExitOrNavigate', params: { url: string, routerDirection: RouteDirection|undefined } }
  | { type: 'tabbed-page-nag-listeners:registration', params: { currentComponentInstancePath: string, startingHistoryPosition: number } }
  | { type: 'nav-callback:no-op', params: { reason: string } }
  | { type: 'tab-exit-or-navigate-callback:no-op', params: { reason: string } }
  | { type: 'ionRouter:navigate', params: { url: string, routerDirection: RouteDirection, routerAction: RouteAction } }
  | { type: 'goBackOrNavigateTo', params: { url: string, routerDirection: RouteDirection|undefined, routerGoBacks: number, startingHistoryPosition: number, historyPosition: number } }
  | { type: 'otherNavCallbackDelegation', params: { perComponentPathCallbacksSize: number } }

declare global {
  interface Window {
    _overrideCurrentEventDescriptorInfos(overridenEventDescriptorProperties: OverridableEventDescriptorProperties): void;
    _overrideListableEventProperties(overridenListableEventProperties: OverridableListableEventProperties): void;
    overrideCurrentClock: typeof overrideCurrentClock;
    _overrideCurrentClock(clockOrDate: Clock | ISODatetime, clockType: 'fixed'|'shifted', temporalDurationOrSeconds?: Temporal.Duration | number | undefined): void;
    useManagedVueRefs(enabled: boolean): void;
    updateLogConfigTo: typeof updateLogConfigTo;
    getCurrentComponentInstancePath: typeof getCurrentComponentInstancePath;
    _router: typeof router;
    _ionRouter: ReturnType<typeof useIonRouter>;
    _tabbedPageNavigationEvents: Array<{ type: TabbedPageNavigationEvent['type'], date: string, location: string, historyPosition: number, params: object }>;
    trackTabbedPageNavigationEvent(event: TabbedPageNavigationEvent): void;
  }
}

export function useDevUtilities() {
    if(!overridenListableEventPropertiesRef) {
        overridenListableEventPropertiesRef = ref(undefined);
    }
    if(!overridenEventDescriptorPropertiesRef) {
        overridenEventDescriptorPropertiesRef = ref(undefined);
    }

    function overrideListableEventProperties(overridenListableEventProperties: OverridableListableEventProperties) {
        overridenListableEventPropertiesRef!.value = overridenListableEventProperties;
    }

    function overrideCurrentEventDescriptorInfos(overridenEventDescriptorProperties: OverridableEventDescriptorProperties) {
        overridenEventDescriptorPropertiesRef!.value = overridenEventDescriptorProperties;
        overrideListableEventProperties(overridenEventDescriptorProperties);
    }

    window._overrideCurrentEventDescriptorInfos = overrideCurrentEventDescriptorInfos;
    window._overrideListableEventProperties = overrideListableEventProperties;
    window.overrideCurrentClock = overrideCurrentClock;
    window._overrideCurrentClock = (clockOrDate: Clock | ISODatetime, clockType: 'fixed'|'shifted', temporalDurationOrSeconds?: Temporal.Duration | number | undefined) => {
        const clock = match([clockOrDate, clockType])
            .with([P.string, 'fixed'], ([isoDate, _]) => new FixedTimeClock(isoDate))
            .with([P.string, 'shifted'], ([isoDate, _]) => new ShiftedTimeClock(isoDate))
            .with(([{ zonedDateTimeISO: P.any }, P._]), ([clock, _]) => clock)
            .otherwise(() => { throw new Error(`Unexpected params in _overrideCurrentClock()`); })

        const duration = match(temporalDurationOrSeconds)
            .with(undefined, () => undefined)
            .with(P.number, (seconds) => Temporal.Duration.from({seconds}))
            .otherwise((duration) => duration);

        overrideCurrentClock(clock, duration? () => {
            return new Promise(resolve => {
                setTimeout(resolve, duration.total('milliseconds'));
            })
        }:undefined)
    }
    window.useManagedVueRefs = (enabled: boolean) => {
        localStorage.setItem("_useManagedRefs", ""+enabled);
        window.location.reload();
    }
    window.updateLogConfigTo = updateLogConfigTo;
    window.getCurrentComponentInstancePath = getCurrentComponentInstancePath;
    window._router = router;

    const ionRouter = useIonRouter();
    window._ionRouter = ionRouter;

    window._tabbedPageNavigationEvents = [];
    window.trackTabbedPageNavigationEvent = (event) => {
      window._tabbedPageNavigationEvents.push({
        type: event.type,
        date: new Date().toISOString(),
        historyPosition: history.state.position,
        params: event.params,
        location: window.location.href,
      })
    }
}

// }
