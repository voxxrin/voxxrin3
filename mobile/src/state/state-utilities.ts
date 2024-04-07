import {match, P} from "ts-pattern";
import {Logger} from "@/services/Logger";

const LOGGER = Logger.named("state-utilities");

type ExecutionContext<T> = {
    hash: string,
} & ({
    status: 'created',
} | {
    status: 'ongoing'|'resolved'|'rejected',
    promise: Promise<T>,
    abort: Function|undefined
})
const LAST_EXECUTION_CONTEXTS = new Map<string, ExecutionContext<any>>();
export async function usePromiseDebouncer<T>(executionName: string, executionHash: string, exec: () => { promise: Promise<T>, abort: Function|undefined }): Promise<T> {
    let lastExecContextMatchingName: ExecutionContext<T>|undefined = LAST_EXECUTION_CONTEXTS.get(executionName);
    // Cleaning entries for executionName with either different hash
    // (calling abort() on still-ongoing promises) or rejected status
    if(lastExecContextMatchingName) {
        match(lastExecContextMatchingName)
            .with(
                { status: 'created'},
                (context) => {
                    if(context.hash !== executionHash) {
                        LAST_EXECUTION_CONTEXTS.delete(executionName);
                    }
                }
            ).with(
                { status: 'resolved' },
                (context) => {
                    if(context.hash !== executionHash) {
                        LAST_EXECUTION_CONTEXTS.delete(executionName);
                    }
                }
            ).with(
                { status: 'ongoing' },
                (context) => {
                    if(context.hash !== executionHash) {
                        if(context.abort) {
                            context.abort();
                        }
                        LAST_EXECUTION_CONTEXTS.delete(executionName);
                    }
                }
            ).with(
                { status: 'rejected' },
                () => {
                    LAST_EXECUTION_CONTEXTS.delete(executionName);
                }
            ).exhaustive();
    }

    lastExecContextMatchingName = LAST_EXECUTION_CONTEXTS.get(executionName);
    if(
        lastExecContextMatchingName
        // Implicitely:
        // && lastExecContextMatchingName.hash === executionHash
    ) {
        return match(lastExecContextMatchingName)
            .with({ status: 'created' }, () => {
                LOGGER.debug(() => `Deferring concurrently-created PromiseDebounces for ${executionName}#${executionHash}...`)
                return new Promise<T>((resolve, reject) => {
                    setTimeout(() => {
                        lastExecContextMatchingName = LAST_EXECUTION_CONTEXTS.get(executionName)!;
                        if(lastExecContextMatchingName.status === 'created') {
                            throw new Error(`Timeout after delaying concurrent PromiseDebounce for ${executionName}#${executionHash}`)
                        } else {
                            lastExecContextMatchingName.promise.then(resolve);
                        }
                    }, 500);
                })
            }).with({ status: 'rejected' }, () => {
                throw new Error(`rejected status detected: it is not supposed to happen as
                    it should have been troubleshooting in usePromiseDebouncer() pre-cleaning steps`)
            }).with({ status: 'ongoing' }, (lastExecContextMatchingName) => {
              return lastExecContextMatchingName.promise;
            }).with({ status: 'resolved' }, (lastExecContextMatchingName) => {
              return lastExecContextMatchingName.promise;
            }).exhaustive();
    } else {
        LAST_EXECUTION_CONTEXTS.set(executionName, {
            hash: executionHash,
            status: 'created'
        })

        const { promise, abort } = exec();
        LAST_EXECUTION_CONTEXTS.set(executionName, {
            hash: executionHash,
            status: 'ongoing',
            promise,
            abort
        })

        promise.then(() => {
            LAST_EXECUTION_CONTEXTS.set(executionName, {
                hash: executionHash,
                status: 'resolved',
                promise,
                abort
            })
        }, () => {
            LAST_EXECUTION_CONTEXTS.set(executionName, {
                hash: executionHash,
                status: 'rejected',
                promise,
                abort
            })
        })

        return promise;
    }
}

export async function useFetchJsonDebouncer<T>(executionName: string, executionHash: string, fetchOpts: string|Request): Promise<T> {
    if(typeof fetchOpts==='object' && fetchOpts.signal) {
        throw new Error(`useFetchDebouncer() cannot be called with a signal set in fetchOpts !`)
    }

    return usePromiseDebouncer(executionName, executionHash, () => {
        const controller = new AbortController()

        const promise = match(fetchOpts)
            .with(P.string, (url) => fetch(url, {signal: controller.signal}))
            .otherwise((fetchOpts) => fetch({...fetchOpts, signal: controller.signal}))

        return {
            promise: promise.then(resp => resp.json() as T),
            abort: () => {
                controller.abort(`Aborting request due to concurrent call to useFetchDebouncer()`);
            }
        };
    })
}
