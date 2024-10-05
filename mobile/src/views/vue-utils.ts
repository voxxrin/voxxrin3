import {LocationQueryValue, RouteLocationNormalizedLoaded} from "vue-router";
import {
  MaybeRef,
  onUnmounted,
  Ref,
  ref as vueRef,
  shallowRef as vueShallowRef,
  toRef as vueToRef,
  toValue,
  unref,
  watch,
  WatchSource
} from "vue";
import {Temporal} from "temporal-polyfill";
import {actionSheetController, ActionSheetOptions} from "@ionic/vue";
import {match, P} from "ts-pattern";
import {
  useCollection as vuefireUseCollection,
  UseCollectionOptions,
  useDocument as vuefireUseDocument,
  UseDocumentOptions
} from "vuefire";
import {CollectionReference, DocumentReference, onSnapshot, Unsubscribe} from "firebase/firestore";
import {MultiWatchSources} from "@vueuse/core";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("vue-utils")

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
export const getRouteQueryParamValue = (route: RouteLocationNormalizedLoaded, paramName: string): string|null => {
  const paramValue = route.query[paramName]
  const unwrappedParamValue = match(paramValue)
    .with(P.nullish.or(P.string), val => val)
    .with(P.array(P.nullish.or(P.string)), ([val]) => val)
    .exhaustive()

  return unwrappedParamValue;
}
export const getOptionalTransformedRouteParamsValue = <U>(route: RouteLocationNormalizedLoaded, paramName: string, transformer: (value: string) => U): U|undefined => {
  if(!route.params[paramName]) {
    return undefined;
  }

  return transformer(getRouteParamsValue(route, paramName));
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
    LOGGER.info(`Not implemented yet: ${message}`)
    return Promise.resolve();
    // const alert = await alertController.create({
    //     header: 'Not implemented yet !',
    //     message: message
    // });
    // alert.present();
}

type BaseRegisteredManagedRefEntry = { name: string, refs: Array<Ref>, callStack: string }
type VueRegisteredManagedRefEntry = BaseRegisteredManagedRefEntry & { type: "vue", fct: string, componentName: string, line: string, col: string }
type FirebaseRegisteredManagedRefEntry = BaseRegisteredManagedRefEntry & { type: "firebase", path: string }
type RegisteredManagedRefEntry = VueRegisteredManagedRefEntry | FirebaseRegisteredManagedRefEntry

class ManagedRefs {
    constructor(
        public readonly registeredRefs: Array<RegisteredManagedRefEntry> = []
    ){}

    getOrRegisterFirebaseEntry(path: string, callStack: string): FirebaseRegisteredManagedRefEntry {
        const name = path

        const existingEntry = this.registeredRefs.find(rf => rf.type === "firebase" && rf.name === name) as FirebaseRegisteredManagedRefEntry
        if(existingEntry) {
            return existingEntry;
        }

        const firebaseEntry: FirebaseRegisteredManagedRefEntry = {
            type: "firebase" as const, name: path, refs: [], callStack, path
        }
        this.registeredRefs.push(firebaseEntry)
        return firebaseEntry;
    }

    getOrRegisterVueEntry(fct: string, callStack: string): VueRegisteredManagedRefEntry {
        const [ componentName, line, col ] = callStack.split("\n")[2]
            .replace(/.*\(https?:\/\/[^\/]*\/([^)]*)\)/gi, "$1")
            .split(":")
            .map((chunk, idx) => idx===0
                ?chunk.split("?")[0] // Sometimes, we have query parameters in the component's URL => removing it
                :chunk
            )

        const name = `${fct}@${componentName}:${line}:${col}`

        const existingEntry = this.registeredRefs.find(rf => rf.type === "vue" && rf.name === name) as VueRegisteredManagedRefEntry
        if(existingEntry) {
            return existingEntry;
        }

        const vueEntry: VueRegisteredManagedRefEntry = {
            type: "vue" as const, fct: fct, name, refs: [], callStack, componentName, line, col
        }
        this.registeredRefs.push(vueEntry);
        return vueEntry;
    }

    registerRef(context: {type:"vue", fct: string}|{type:"firebase", path: string}, instance: Ref) {
        const callStack = (new Error().stack || "").substring("Error".length).trim()

        const registeredEntry: RegisteredManagedRefEntry = match(context)
            .with({type:"vue"}, (context) => {
                return this.getOrRegisterVueEntry(context.fct, callStack);
            }).with({type:"firebase"}, (context) => {
                return this.getOrRegisterFirebaseEntry(context.path, callStack);
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

    updateFirebaseRefPath(firebaseRef: Ref, updatedPath: string) {
        const entryIncludingRef = this.registeredRefs.find(entry => entry.type === 'firebase' && entry.refs.includes(firebaseRef));
        if(entryIncludingRef) {
            const indexToDelete = entryIncludingRef.refs.findIndex(ref => ref === firebaseRef);
            entryIncludingRef.refs.splice(indexToDelete, 1);

            const entryMatchingPath = this.getOrRegisterFirebaseEntry(updatedPath, entryIncludingRef.callStack);
            entryMatchingPath.refs.push(firebaseRef);
        } else {
            console.warn(`No entry found matching firebase ref instance, that's weird (this might be caused by a user navigation triggered while every firebase docs were not resolved yet) !`)
        }
    }
}

const MANAGED_REFS = new ManagedRefs();

let ref = vueRef
let toRef = vueToRef
let shallowRef = vueShallowRef
let useDocument = vuefireUseDocument
let useCollection = vuefireUseCollection

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

    useDocument = function managedUseDocument<T extends DocumentReference<unknown>>(documentSourceRef: Ref<T>|T, options?: UseDocumentOptions){
        let instance = vuefireUseDocument<T>(documentSourceRef, options);
        if(options?.target) {
            instance === options.target;
        }

        const documentSource = toValue(documentSourceRef);
        if(documentSource) {
            MANAGED_REFS.registerRef({type:'firebase', path: documentSource.path}, instance);
        } else {
            MANAGED_REFS.registerRef({type:'firebase', path: "???"}, instance);
        }

        return instance;
    }

    useCollection = function managedUseCollection<T extends CollectionReference<unknown>>(collectionSourceRef: Ref<T>|T, options?: UseCollectionOptions){
        const instance = vuefireUseCollection(collectionSourceRef, options);
        if(options?.target) {
            instance === options.target;
        }

        const collectionSource = toValue(collectionSourceRef);
        if(collectionSource) {
            MANAGED_REFS.registerRef({type:'firebase', path: collectionSource.path}, instance);
        } else {
            MANAGED_REFS.registerRef({type:'firebase', path: "???"}, instance);
        }

        return instance;
    }
}

export const managedRef = ref;
export const toManagedRef = toRef;
export const managedShallowRef = shallowRef;
export const managedUseDocument = useDocument;
export const managedUseCollection = useCollection;

(window as any).MANAGED_VUE_REFS = MANAGED_REFS;


// I'm pretty sure we should be able to make it generic, but spent too much time trying to implement the proper infer impl for this :(
export function deferredVuefireUseDocument<T, S1>(sources: [Ref<S1|undefined>], resolveDocSource: (params: [S1|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function
deferredVuefireUseDocument<T, S1, S2>(sources: [Ref<S1|undefined>, Ref<S2|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<T, S1, S2, S3>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<T, S1, S2, S3, S4>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>, Ref<S4|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined, S4|undefined]) => DocumentReference<T>|undefined): Ref<T|undefined>;
export function deferredVuefireUseDocument<SOURCES extends MultiWatchSources, T>(
    sources: SOURCES,
    resolveDocSource: (...values: any[]) => DocumentReference<T>|undefined,
): Ref<T|undefined> {
    const documentRef = ref<T>()

    const docSourceRef = shallowRef<DocumentReference<T>|null>(null);
    useDocument(docSourceRef, {target: documentRef });

    const handleSourceUpdates = (values: any[]) => {
        const docSource = resolveDocSource(values);
        if(docSource) {
            docSourceRef.value = docSource;
            MANAGED_REFS.updateFirebaseRefPath(documentRef, docSource.path);
        }
    };

    if(sources.length) {
        watch(sources, handleSourceUpdates, {immediate: true})
    } else {
        handleSourceUpdates([])
    }

    return documentRef;
}

export function deferredVuefireUseCollection<T, TV = T>(sources: [], resolveDocSource: (params: []) => Array<CollectionReference<T>>|undefined, firestoreValueTransformer: (firestoreValue: T) => TV, collectionInitializer: (ref: Ref<Map<string, TV>>) => void, onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void): Ref<Map<string, TV>>;
export function deferredVuefireUseCollection<S1, T, TV = T>(sources: [Ref<S1|undefined>], resolveDocSource: (params: [S1|undefined]) => Array<CollectionReference<T>>|undefined, firestoreValueTransformer: (firestoreValue: T) => TV, collectionInitializer: (ref: Ref<Map<string, TV>>, s1: S1) => void, onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void): Ref<Map<string, TV>>;
export function deferredVuefireUseCollection<S1, S2, T, TV = T>(sources: [Ref<S1|undefined>, Ref<S2|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined]) => Array<CollectionReference<T>>|undefined, firestoreValueTransformer: (firestoreValue: T) => TV, collectionInitializer: (ref: Ref<Map<string, TV>>, s1: S1, s2: S2) => void, onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void): Ref<Map<string, TV>>;
export function deferredVuefireUseCollection<S1, S2, S3, T, TV = T>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined]) => Array<CollectionReference<T>>|undefined, firestoreValueTransformer: (firestoreValue: T) => TV, collectionInitializer: (ref: Ref<Map<string, TV>>, s1: S1, s2: S2, s3: S3) => void, onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void): Ref<Map<string, TV>>;
export function deferredVuefireUseCollection<S1, S2, S3, S4, T, TV = T>(sources: [Ref<S1|undefined>, Ref<S2|undefined>, Ref<S3|undefined>, Ref<S4|undefined>], resolveDocSource: (params: [S1|undefined, S2|undefined, S3|undefined, S4|undefined]) => Array<CollectionReference<T>>|undefined, firestoreValueTransformer: (firestoreValue: T) => TV, collectionInitializer: (ref: Ref<Map<string, TV>>, s1: S1, s2: S2, s3: S3, s4: S4) => void, onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void): Ref<Map<string, TV>>;
export function deferredVuefireUseCollection<SOURCES extends MultiWatchSources, T, TV = T>(
    sources: SOURCES,
    resolveCollectionSources: (...values: any[]) => Array<CollectionReference<T>>|undefined,
    firestoreValueTransformer: (firestoreValue: T) => TV = (value) => value as unknown as TV,
    collectionInitializer: (ref: Ref<Map<string, TV>>, ...values: (Object|WatchSource<unknown>)[]) => void = () => {},
    onSnapshotChange: (change: {'type': 'created', createdDoc: TV}|{'type': 'updated', updatedDoc: TV}|{'type':'deleted', deletedDoc: TV}, docId: string, collectionRef: Ref<Map<string, TV>>) => void,
): Ref<Map<string, TV>> {

    const collectionRef = ref<Map<string, TV>>(new Map()) as Ref<Map<string, TV>>;

    const registeredSnapshotCleaners: Unsubscribe[] = [];

    const handleSourceUpdates = (values: (Object|WatchSource<unknown>)[]) => {
        const collectionSources = resolveCollectionSources(values);
        if(collectionSources && collectionSources.length){

            // Resetting collection ref...
            // Important note: resetting map should be up to collectionInitializer() implementation
            // (sometimes, we might want it, sometimes not)
            collectionInitializer(collectionRef, ...values);

            // Cleaning previous snapshot cleaners...
            registeredSnapshotCleaners.forEach(snapshotCleaner => snapshotCleaner());
            registeredSnapshotCleaners.splice(0, registeredSnapshotCleaners.length);

            // Re-subscribing to collection updates...
            const snapshotCleaners = collectionSources.map(collectionSource => onSnapshot(collectionSource, snapshot => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        onSnapshotChange({type:'created', createdDoc: firestoreValueTransformer(change.doc.data())}, change.doc.id, collectionRef)
                        LOGGER.debug(() => `New document @/${collectionSource.path || `query(${(collectionSource as any)._query?.path})`}: `, change.doc.data());
                    }
                    if (change.type === "modified") {
                        onSnapshotChange({type:'updated', updatedDoc: firestoreValueTransformer(change.doc.data())}, change.doc.id, collectionRef)
                        LOGGER.debug(() => `Updated document @/${collectionSource.path || `query(${(collectionSource as any)._query?.path})`}: `, change.doc.data());
                    }
                    if (change.type === "removed") {
                        onSnapshotChange({type:'deleted', deletedDoc: collectionRef.value.get(change.doc.id)!}, change.doc.id, collectionRef)
                        LOGGER.debug(() => `Deleted document @/${collectionSource.path || `query(${(collectionSource as any)._query?.path})`} having id: ${change.doc.id}`);
                    }
                });
            }));

            registeredSnapshotCleaners.push(...snapshotCleaners);
        }
    };

    if(sources.length) {
        watch(sources, handleSourceUpdates, {immediate:true})
    } else {
        handleSourceUpdates([]);
    }

    onUnmounted(() => {
        registeredSnapshotCleaners.forEach(snapshotCleaner => snapshotCleaner());
    })

    return collectionRef;
}

export const MAX_NUMBER_OF_PARAMS_IN_FIREBASE_IN_CLAUSES = 30;
