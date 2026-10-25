import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import {
    aliases, mdi,
} from 'vuetify/iconsets/mdi';

export default defineNuxtPlugin({
    name: 'vuetify',
    setup(nuxtApp) {
        const vuetify = createVuetify({
            components,
            directives,
            theme: { defaultTheme: 'light' },
            icons: {
                defaultSet: 'mdi',
                aliases,
                sets: { mdi },
            },
            display: {
                mobileBreakpoint: 'sm',
                thresholds: {
                    xs: 0,
                    sm: 600,
                    md: 960,
                    lg: 1280,
                    xl: 1920,
                },
            },
        });

        nuxtApp.vueApp.use(vuetify);
    },
});
