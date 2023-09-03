import {RouteLocationNormalizedLoaded} from "vue-router";
import {onUnmounted, Ref, unref} from "vue";
import {Temporal} from "temporal-polyfill";
import {actionSheetController, ActionSheetOptions, alertController} from "@ionic/vue";
import {match} from "ts-pattern";

// Ensure that we only get a single value from route params
// this is intended to workaround the fact that route.params.foo is string|string[] and we want
// to "flatten" this
export const getRouteParamsValue = (route: RouteLocationNormalizedLoaded, paramName: string): string => {
    let paramValue = route.params[paramName]

    if (Array.isArray(paramValue) && paramValue.length) {
        [paramValue] = paramValue
    }

    return paramValue as string;
}

export function isRefDefined<T>(ref: Ref<T | undefined>): ref is Ref<T> {
    return unref(ref) !== undefined;
}
export function isRefUndefined<T>(ref: Ref<T | undefined>): ref is Ref<undefined> {
    return (ref.value === undefined);
}


export type UseIntervalDurationOpts = {freq: "high-frequency"|"low-frequency"}|{freq:"custom", duration: Parameters<typeof Temporal.Duration.from>[0]};
const STD_DURATIONS: {[freq in Exclude<UseIntervalDurationOpts['freq'], "custom">]: Parameters<typeof Temporal.Duration.from>[0] } = {
    "high-frequency": { seconds: 5 },
    "low-frequency": { seconds: 60 }
}
const CACHED_SETINTERVALS: Map<number, { intervalId: number, listeners: Array<Function> }> = new Map();
export async function useInterval(callback: Function, durationOpts: UseIntervalDurationOpts, opts?: {
    immediate: boolean
}) {
    if(opts?.immediate) {
        callback();
    }

    const duration = match(durationOpts)
        .with({freq: "custom"}, (customDuration) => Temporal.Duration.from(customDuration.duration))
        .otherwise(({freq}) => Temporal.Duration.from(STD_DURATIONS[freq]));

    const msDuration = duration.total('milliseconds');
    if(!CACHED_SETINTERVALS.has(msDuration)) {
        const listeners: Array<Function> = [];
        const intervalId = window.setInterval(() => {
            listeners.forEach(listener => listener());
        }, msDuration);
        CACHED_SETINTERVALS.set(msDuration, { intervalId, listeners })
    }

    const setIntervalEntry = CACHED_SETINTERVALS.get(msDuration)!
    setIntervalEntry.listeners.push(callback)

    onUnmounted(() => {
        const indexToRemove = setIntervalEntry.listeners.findIndex(cbk => callback === cbk);
        setIntervalEntry.listeners.splice(indexToRemove, 1);

        if(setIntervalEntry.listeners.length === 0) {
            clearInterval(setIntervalEntry.intervalId);
            CACHED_SETINTERVALS.delete(msDuration);
        }
    })

    return setIntervalEntry.intervalId;
}

export async function presentActionSheetController(
    config: ActionSheetOptions
) {
    const actionSheet = await actionSheetController.create(config);

    await actionSheet.present()
    const result = await actionSheet.onWillDismiss();

    return result.data;
}

export type Unreffable<T> = T | Ref<T>

export async function toBeImplemented(message: string) {
    const alert = await alertController.create({
        header: 'Not implemented yet !',
        message: message
    });
    alert.present();
}
