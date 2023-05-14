<template>
  <span>{{displayedRange()}}</span>
</template>

<script setup lang="ts">
import {PropType} from "vue";
import {MonthDayFormatOpts, monthDayFormattedRange} from "@/models/DatesAndTime";
import {Temporal} from "temporal-polyfill";
import {ISOLocalDate} from "../../../shared/type-utils";

const props = defineProps({
    range: {
        required: true,
        type: Object as PropType<{
            start: ISOLocalDate | Temporal.ZonedDateTime,
            end: ISOLocalDate | Temporal.ZonedDateTime,
        }>
    },
    format: {
        required: false,
        type: Object as PropType<Partial<MonthDayFormatOpts>>
    }
})

function displayedRange() {
    if(props.range?.start && props.range?.end) {
        return monthDayFormattedRange(props.range.start, props.range.end, props.format);
    } else {
        return `???`
    }
}

</script>

<style scoped lang="scss">
</style>
