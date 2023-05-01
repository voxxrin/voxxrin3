import {Temporal} from 'temporal-polyfill'

export class ValueObject<T> {
    constructor(readonly value: T) {}

    isSameThan<VO extends ValueObject<T>>(other: VO|undefined) {
        if(other === undefined) {
            return false;
        }

        return this.value === other.value;
    }
}

export async function executeAndSetInterval(callback: Function, duration: Temporal.Duration) {
    callback();
    return setInterval(callback, duration.total('milliseconds'));
}
