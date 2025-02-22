<template>
  <ion-header class="toolbarHeader">
    <ion-toolbar>
      <ion-title slot="start">{{ title }}</ion-title>

      <transition name="searchBar" v-if="searchEnabled">
        <div v-if="searchFieldDisplayed" class="search-input">
          <ion-input :size="10" ref="$searchInput"
                     :debounce="300"
                     :placeholder="`${LL.Search()}...`"
                      :clear-input="true"
                     v-model="searchTermsRef"
                     @ionInput="(ev) => $emits('search-terms-updated', ''+(ev.target.value ?? ''))"
          />
          <ion-icon class="iconInput" src="/assets/icons/line/search-line.svg"></ion-icon>
          <ion-button shape="round" size="small" fill="outline" @click="toggleSearchField()"
                      :aria-label="LL.Search_close()">
            <ion-icon src="/assets/icons/line/arrow-right-line.svg"></ion-icon>
          </ion-button>
        </div>
      </transition>

      <div class="toolbarHeader-actions" slot="end">
        <list-mode-switch v-if="modes && modes.length > 1" :modes="modes" @mode-updated="(updatedModeId, previousModeId) => $emits('mode-updated', updatedModeId, previousModeId)"></list-mode-switch>
        <slot />
        <ion-button slot="end" shape="round" size="small" @click="toggleSearchField()"
                    :aria-label="LL.Search()" v-if="searchEnabled">
          <ion-icon src="/assets/icons/line/search-line.svg"></ion-icon>
        </ion-button>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {IonButton, IonInput} from "@ionic/vue";
import {typesafeI18n} from "@/i18n/i18n-vue";
import ListModeSwitch from "@/components/ui/ListModeSwitch.vue";
import {nextTick, PropType} from "vue";
import {isRefDefined, managedRef as ref} from "@/views/vue-utils";

const props = defineProps({
  title: {
    required: true,
    type: String,
  },
  searchEnabled: {
    required: false,
    type: Boolean,
    default: false
  },
  modes: {
    required: false,
    type: Array as PropType<Array<{id: string, icon: string, label: string}>>,
  },
})

const $emits = defineEmits<{
  (e: 'search-terms-updated', value: string): void,
  (e: 'mode-updated', updatedModeId: string, previousModeId: string|undefined): void,
}>()

const { LL } = typesafeI18n()
const searchFieldDisplayed = ref(false);
const searchTermsRef = ref<string|undefined>(undefined);
const $searchInput = ref<{ $el: HTMLIonInputElement }|undefined>(undefined);

async function toggleSearchField() {
  searchFieldDisplayed.value = !searchFieldDisplayed.value
  if(searchFieldDisplayed.value) {
    await nextTick(); // Wait for Vue to update the DOM
    if(isRefDefined($searchInput)) {
      setTimeout(() => $searchInput.value.$el.setFocus(), 100);
    }
  }
}
</script>

<style lang="scss" scoped>
.searchBar-enter-active, .searchBar-leave-active {
  transition: width 120ms cubic-bezier(0.250, 0.460, 0.450, 0.940);
}

.searchBar-enter-from, .searchBar-leave-to {
  width: 0;
}

.searchBar-enter-to, .searchBar-leave-from {
  width: 100%;
}

ion-toolbar {
  position: sticky;
  top: 0;
}

.toolbarHeader {
  &-actions {
    display: flex;
    align-items: center;
    gap: var(--app-gutters);
  }
}

:deep(ion-input) button.input-clear-icon {
  margin-right: 80px;
}
</style>
