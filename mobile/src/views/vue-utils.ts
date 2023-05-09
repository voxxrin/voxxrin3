import {RouteLocationNormalizedLoaded} from "vue-router";
import {ComponentInternalInstance, onUnmounted, ref, Ref, watch} from "vue";
import {Temporal} from "temporal-polyfill";
import {
    ActionSheetButton
} from "@ionic/core/dist/types/components/action-sheet/action-sheet-interface";
import {actionSheetController, ActionSheetOptions} from "@ionic/vue";

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
    return (ref.value !== undefined);
}
export function isRefUndefined<T>(ref: Ref<T | undefined>): ref is Ref<undefined> {
    return (ref.value === undefined);
}

export async function useInterval(callback: Function, durationOpts: Parameters<typeof Temporal.Duration.from>[0], opts?: {
    immediate: boolean
}) {
    if(opts?.immediate) {
        callback();
    }
    const interval = setInterval(callback, Temporal.Duration.from(durationOpts).total('milliseconds'));
    onUnmounted(() => {
        clearInterval(interval);
    })
    return interval;
}

export async function presentActionSheetController(
    config: ActionSheetOptions
) {
    const actionSheet = await actionSheetController.create(config);

    await actionSheet.present()
    const result = await actionSheet.onWillDismiss();

    return result.data;
}
