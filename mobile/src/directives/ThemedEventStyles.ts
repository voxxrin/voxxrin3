import {VoxxrinEventTheme} from "@/models/VoxxrinEvent";
import {ObjectDirective} from "vue";

declare global {
  interface HTMLElement {
    __colorSchemeListener__?: (e: MediaQueryListEvent) => void;
  }
}

const isDarkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

export const provideThemedEventStyles: ObjectDirective<HTMLElement, { theming: VoxxrinEventTheme, backgroundUrl: string, logoUrl: string }|undefined> = {
  mounted(el, binding) {
      const applyStyles = (isDark: boolean) => {
        if(binding.value) {
          const colorsStyles = isDark ? binding.value.theming.colors.dark : binding.value.theming.colors.light;

          const variableStyles = {
            '--voxxrin-event-background-url': `url('${binding.value.backgroundUrl}')`,
            '--voxxrin-event-logo-url': `url('${binding.value.logoUrl}')`,
            '--voxxrin-event-theme-colors-primary-hex': colorsStyles.primaryHex,
            '--voxxrin-event-theme-colors-primary-rgb': colorsStyles.primaryRGB,
            '--voxxrin-event-theme-colors-primary-contrast-hex': colorsStyles.primaryContrastHex,
            '--voxxrin-event-theme-colors-primary-contrast-rgb': colorsStyles.primaryContrastRGB,
            '--voxxrin-event-theme-colors-secondary-hex': colorsStyles.secondaryHex,
            '--voxxrin-event-theme-colors-secondary-rgb': colorsStyles.secondaryRGB,
            '--voxxrin-event-theme-colors-secondary-contrast-hex': colorsStyles.secondaryContrastHex,
            '--voxxrin-event-theme-colors-secondary-contrast-rgb': colorsStyles.secondaryContrastRGB,
            '--voxxrin-event-theme-colors-tertiary-hex': colorsStyles.tertiaryHex,
            '--voxxrin-event-theme-colors-tertiary-rgb': colorsStyles.tertiaryRGB,
            '--voxxrin-event-theme-colors-tertiary-contrast-hex': colorsStyles.tertiaryContrastHex,
            '--voxxrin-event-theme-colors-tertiary-contrast-rgb': colorsStyles.tertiaryContrastRGB,
          };

          (Object.keys(variableStyles) as Array<keyof typeof variableStyles>).forEach((varName) => {
            el.style.setProperty(varName, variableStyles[varName]);
          })
        }
      };

      const listener = (e: MediaQueryListEvent) => applyStyles(e.matches)
      el.__colorSchemeListener__ = listener;
      isDarkMediaQuery.addEventListener('change', listener);

      applyStyles(isDarkMediaQuery.matches);
  },
  unmounted(el) {
    if (el.__colorSchemeListener__) {
      isDarkMediaQuery.removeEventListener('change', el.__colorSchemeListener__);
      delete el.__colorSchemeListener__;
    }
  }

}
