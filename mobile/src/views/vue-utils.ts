import {RouteLocationNormalizedLoaded} from "vue-router";
import {
    onUnmounted,
    Ref,
    unref,
    ref as vueRef,
    toRef as vueToRef,
    shallowRef as vueShallowRef,
    MaybeRef, watch, toValue
} from "vue";
import {Temporal} from "temporal-polyfill";
import {actionSheetController, ActionSheetOptions, alertController} from "@ionic/vue";
import {match, P} from "ts-pattern";
import {
    useCollection as vuefireUseCollection,
    useDocument as vuefireUseDocument,
} from "vuefire";
import { CollectionReference, DocumentReference} from "firebase/firestore";
import {MultiWatchSources} from "@vueuse/core";

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

type BaseRegisteredManagedRefEntry = { name: string, refs: Array<Ref>, callStack: string }
type VueRegisteredManagedRefEntry = BaseRegisteredManagedRefEntry & { type: "vue", fct: string, componentName: string, line: string, col: string }
type RegisteredManagedRefEntry = BaseRegisteredManagedRefEntry & { type: "vue", fct: string, componentName: string, line: string, col: string }

class ManagedRefs {
    constructor(
        public readonly registeredRefs: Array<RegisteredManagedRefEntry> = []
    ){}

    registerRef(context: {type:"vue", fct: string}, instance: Ref) {
        const callStack = (new Error().stack || "").substring("Error".length).trim()

        const registeredEntry: RegisteredManagedRefEntry = match(context)
            .with({type:"vue"}, (context) => {
                const [ componentName, line, col ] = callStack.split("\n")[2].replace(/.*\(https?:\/\/[^\/]*\/([^)]*)\)/gi, "$1").split(":")
                const name = `${context.fct}@${componentName}:${line}:${col}`

                const existingEntry = this.registeredRefs.find(rf => rf.type === context.type && rf.name === name)
                if(existingEntry) {
                    return existingEntry;
                }

                const vueEntry: VueRegisteredManagedRefEntry = {
                    type: "vue" as const, fct: context.fct, name, refs: [], callStack, componentName, line, col
                }
                this.registeredRefs.push(vueEntry);
                return vueEntry;
            }).exhaustive();

        registeredEntry.refs.push(instance);

        onUnmounted(() => {
            const refIndex = registeredEntry.refs.findIndex(ref => ref === instance);
            registeredEntry.refs.splice(refIndex, 1);

            if(!registeredEntry.refs.length) {
                const entryIndex = this.registeredRefs.findIndex(rf =>
                    rf.type === registeredEntry.type
                    && rf.name === registeredEntry.name
                )
                this.registeredRefs.splice(entryIndex, 1);
            }
        })

        return instance;
    }

    allRefs() {
        return this.registeredRefs.flatMap(rr => rr.refs);
    }

    distinctComponents() {
        return Array.from(new Set(this.registeredRefs.map(rr => rr.name)));
    }
    distinctComponentsDeclarations() {
        return Array.from(new Set(this.registeredRefs.map(rr => `${rr.type}:${rr.name}`))).sort();
    }

    refsForDeclaration(declaration: string) {
        return this.registeredRefs
            .filter(rr => `${rr.type}:${rr.name}` === declaration)
            .flatMap(rr => rr.refs);
    }
    componentDeclarationsRef() {
        return this.distinctComponentsDeclarations().map(decl => ({ decl, refs: this.refsForDeclaration(decl) }))
    }
}

const MANAGED_REFS = new ManagedRefs();

let ref = vueRef
let toRef = vueToRef
let shallowRef = vueShallowRef

if(import.meta.env.VITE_USE_MANAGED_REFS === 'true' || localStorage.getItem("_useManagedRefs") === "true") {
    ref = function managedRef(value: unknown){
        const instance = vueRef(value);

        MANAGED_REFS.registerRef({type:'vue', fct: 'ref'}, instance);

        return instance;
    } as any

    toRef = function managedToRef(
        source: Record<string, any> | MaybeRef,
        key?: string,
        defaultValue?: unknown
    ): Ref {
        const instance = key?vueToRef(source, key, defaultValue):vueToRef(source);

        MANAGED_REFS.registerRef({type:'vue', fct: 'toRef'}, instance);

        return instance;
    } as any

    shallowRef = function managedShallowRef(value: unknown){
        const instance = vueShallowRef(value);

        MANAGED_REFS.registerRef({type:'vue', fct: 'shallowRef'}, instance);

        return instance;
    } as any
}

export const managedRef = ref;
export const toManagedRef = toRef;
export const managedShallowRef = shallowRef;

(window as any).MANAGED_VUE_REFS = MANAGED_REFS;


// I'm pretty sure we should be able to make it generic, but spent too much time trying to implement the proper infer impl for this :(
export function deferredVuefireUseDocument<T, S1>(sources: [Ref<S1|undefined>], resolveDocSource: (params: [S1|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<T, S1, S2>(sources: [Ref<S1|undefined>, Ref<S2|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<T, S1, S2, S3>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<T, S1, S2, S3, S4>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>, Ref<S4|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined, S4|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<SOURCES extends MultiWatchSources, T>(sources: SOURCES, resolveDocSource: (...values: any[]) => DocumentReference<T>|undefined): Ref<T|undefined> {
    const documentRef = shallowRef<T>()

    const docSourceRef = shallowRef<DocumentReference<T>|null>(null);
    vuefireUseDocument(docSourceRef, {target: documentRef });

    const handleSourceUpdates = (values: any[]) => {
        const docSource = resolveDocSource(values);
        if(docSource) {
            docSourceRef.value = docSource;
        }
    };

    if(sources.length) {
        watch(sources, handleSourceUpdates, {immediate: true})
    } else {
        handleSourceUpdates([])
    }

    return documentRef;
}

export function deferredVuefireUseCollection<T>(sources: [], resolveDocSource: (params: []) => CollectionReference<T>|undefined): Ref<T[]>;
export function deferredVuefireUseCollection<T, S1>(sources: [Ref<S1|undefined>], resolveDocSource: (params: [S1|undefined]) => CollectionReference<T>|undefined): Ref<T[]>;
export function deferredVuefireUseCollection<T, S1, S2>(sources: [Ref<S1|undefined>, Ref<S2|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined]) => CollectionReference<T>|undefined): Ref<T[]>;
export function deferredVuefireUseCollection<T, S1, S2, S3>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined]) => CollectionReference<T>|undefined): Ref<T[]>;
export function deferredVuefireUseCollection<T, S1, S2, S3, S4>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>, Ref<S4|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined, S4|undefined]) => CollectionReference<T>|undefined): Ref<T[]>;
export function deferredVuefireUseCollection<SOURCES extends MultiWatchSources, T>(sources: SOURCES, resolveCollectionSource: (...values: any[]) => CollectionReference<T>|undefined): Ref<T[]> {
    const collectionRef = shallowRef<T[]>([]);

    const collectionSourceRef = shallowRef<CollectionReference<T>|null>(null);
    vuefireUseCollection(collectionSourceRef, {target: collectionRef });

    const handleSourceUpdates = (values: any[]) => {
        const collectionSource = resolveCollectionSource(values);
        if(collectionSource) {
            collectionSourceRef.value = collectionSource;
        }
    };

    if(sources.length) {
        watch(sources, handleSourceUpdates,{immediate: true})
    } else {
        handleSourceUpdates([]);
    }


    return collectionRef;
}
