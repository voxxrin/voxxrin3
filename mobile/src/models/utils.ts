

export class ValueObject<T> {
    constructor(readonly value: T) {}

    isSameThan<VO extends ValueObject<T>>(other: VO) {
        return this.value === other.value;
    }
}
