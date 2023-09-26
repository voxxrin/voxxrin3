import {VoxxrinEventTheme} from "@/models/VoxxrinEvent";
import {DirectiveBinding} from "vue";

export function provideThemedEventStyles(el: HTMLElement, binding: DirectiveBinding<{ theming: VoxxrinEventTheme, backgroundUrl: string, logoUrl: string }|undefined>) {
    if(binding.value) {
        const variableStyles = {
            '--voxxrin-event-background-url': `url('${binding.value.backgroundUrl}')`,
            '--voxxrin-event-logo-url': `url('${binding.value.logoUrl}')`,
            '--voxxrin-event-theme-colors-primary-hex': binding.value.theming.colors.primaryHex,
            '--voxxrin-event-theme-colors-primary-rgb': binding.value.theming.colors.primaryRGB,
            '--voxxrin-event-theme-colors-primary-contrast-hex': binding.value.theming.colors.primaryContrastHex,
            '--voxxrin-event-theme-colors-primary-contrast-rgb': binding.value.theming.colors.primaryContrastRGB,
            '--voxxrin-event-theme-colors-secondary-hex': binding.value.theming.colors.secondaryHex,
            '--voxxrin-event-theme-colors-secondary-rgb': binding.value.theming.colors.secondaryRGB,
            '--voxxrin-event-theme-colors-secondary-contrast-hex': binding.value.theming.colors.secondaryContrastHex,
            '--voxxrin-event-theme-colors-secondary-contrast-rgb': binding.value.theming.colors.secondaryContrastRGB,
            '--voxxrin-event-theme-colors-tertiary-hex': binding.value.theming.colors.tertiaryHex,
            '--voxxrin-event-theme-colors-tertiary-rgb': binding.value.theming.colors.tertiaryRGB,
            '--voxxrin-event-theme-colors-tertiary-contrast-hex': binding.value.theming.colors.tertiaryContrastHex,
            '--voxxrin-event-theme-colors-tertiary-contrast-rgb': binding.value.theming.colors.tertiaryContrastRGB,
        };

        (Object.keys(variableStyles) as Array<keyof typeof variableStyles>).forEach((varName) => {
            el.style.setProperty(varName, variableStyles[varName]);
        })
    }
}
