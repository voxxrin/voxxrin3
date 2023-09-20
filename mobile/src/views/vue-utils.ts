import {RouteLocationNormalizedLoaded} from "vue-router";
import {
    onUnmounted,
    Ref,
    unref,
    ref as vueRef,
    toRef as vueToRef,
    MaybeRef
} from "vue";
import {Temporal} from "temporal-polyfill";
import {actionSheetController, ActionSheetOptions, alertController} from "@ionic/vue";
import {match, P} from "ts-pattern";

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

type RegisteredManagedRefEntry = { componentName: string, line: string, col: string, refs: Array<Ref>, callStack: string };
class ManagedRefs {
    constructor(
        public readonly registeredRefs: Array<RegisteredManagedRefEntry> = []
    ){}

    registerRef(instance: Ref) {
        const callStack = (new Error().stack || "").substring("Error".length).trim()

        const [ componentName, line, col ] = callStack.split("\n")[2].replace(/.*\(https?:\/\/[^\/]*\/([^)]*)\)/gi, "$1").split(":")

        const registeredEntry = match(this.registeredRefs.find(rf => rf.componentName === componentName && rf.line === line && rf.col === col))
            .with(P.nullish, () => {
                const entry: RegisteredManagedRefEntry = {
                    componentName, line, col, refs: [], callStack
                }
                this.registeredRefs.push(entry);
                return entry;
            }).otherwise((entry) => entry)

        registeredEntry.refs.push(instance);

        onUnmounted(() => {
            const refIndex = registeredEntry.refs.findIndex(ref => ref === instance);
            registeredEntry.refs.splice(refIndex, 1);

            if(!registeredEntry.refs.length) {
                const entryIndex = this.registeredRefs.findIndex(rf =>
                    rf.componentName === registeredEntry.componentName
                    && rf.line === registeredEntry.line
                    && rf.col === registeredEntry.col
                )
                this.registeredRefs.splice(entryIndex, 1);
            }
        })
    }

    allRefs() {
        return this.registeredRefs.flatMap(rr => rr.refs);
    }

    distinctComponents() {
        return Array.from(new Set(this.registeredRefs.map(rr => rr.componentName)));
    }
    distinctComponentsDeclarations() {
        return Array.from(new Set(this.registeredRefs.map(rr => `${rr.componentName}:${rr.line}:${rr.col}`)));
    }
    componentsRefs() {
        return this.distinctComponents().map(component => ({ component, refs: this.refsForComponent(component)}))
    }

    refsForComponent(componentName: string) {
        return this.registeredRefs
            .filter(rr => rr.componentName === componentName)
            .flatMap(rr => rr.refs);
    }
    refsForComponentDeclaration(componentDeclaration: string) {
        return this.registeredRefs
            .filter(rr => `${rr.componentName}:${rr.line}:${rr.col}` === componentDeclaration)
            .flatMap(rr => rr.refs);
    }
    componentDeclarationsRef() {
        return this.distinctComponentsDeclarations().map(decl => ({ declaration: decl, refs: this.refsForComponentDeclaration(decl) }))
    }
}

const MANAGED_REFS = new ManagedRefs();

let ref = vueRef
let toRef = vueToRef

if(import.meta.env.VITE_USE_MANAGED_REFS === 'true' || localStorage.getItem("_useManagedRefs") === "true") {
    ref = function managedRef(value: unknown){
        const instance = vueRef(value);

        MANAGED_REFS.registerRef(instance);

        return instance;
    } as any

    toRef = function managedToRef(
        source: Record<string, any> | MaybeRef,
        key?: string,
        defaultValue?: unknown
    ): Ref {
        const instance = key?vueToRef(source, key, defaultValue):vueToRef(source);

        MANAGED_REFS.registerRef(instance);

        return instance;
    } as any
}

export const managedRef = ref;
export const toManagedRef = toRef;

(window as any).MANAGED_VUE_REFS = MANAGED_REFS;
