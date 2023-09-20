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
import {managedRef as ref} from "@/views/vue-utils";
import {ListableVoxxrinEvent} from "@/models/VoxxrinEvent";
import {Ref} from "vue";


// if(import.meta.env.DEV) {
// May be useful for debug purposes

type OverridableListableEventProperties = {eventId: string} & Partial<Pick<ListableVoxxrinEvent, "theming"|"location"|"backgroundUrl"|"logoUrl">>;
type OverridableEventDescriptorProperties = {eventId: string} & Partial<Pick<VoxxrinConferenceDescriptor, "headingTitle"|"theming"|"features"|"infos"|"location"|"backgroundUrl"|"logoUrl">>;

let overridenListableEventPropertiesRef: Ref<OverridableListableEventProperties|undefined>|undefined = undefined
let overridenEventDescriptorPropertiesRef: Ref<OverridableEventDescriptorProperties|undefined>|undefined = undefined

export function useOverridenListableEventProperties(){ return overridenListableEventPropertiesRef; }
export function useOverridenEventDescriptorProperties() { return overridenEventDescriptorPropertiesRef; }

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

    (window as any)._overrideCurrentEventDescriptorInfos = overrideCurrentEventDescriptorInfos;
    (window as any)._overrideListableEventProperties = overrideListableEventProperties;
    (window as any).overrideCurrentClock = overrideCurrentClock;
    (window as any)._overrideCurrentClock = (clockOrDate: Clock | ISODatetime, clockType: 'fixed'|'shifted', temporalDurationOrSeconds?: Temporal.Duration | number | undefined) => {
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
}

// }
