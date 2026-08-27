import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import Tooltip from 'primevue/tooltip'

import 'remixicon/fonts/remixicon.css'
import 'primeicons/primeicons.css'
import '@/assets/styles/main.css'
import '@/assets/styles/print.css'

import { ptBRLocale } from '@/locales/pt-br'

import App from './App.vue'
import router from './router'

/**
 * Custom Preset PrimeVue - Paleta Final Pink:
 * #E11D48 (Crimson Pink)
 * #A80038 (Dark Cherry)
 * #FFE5EC (Blush)
 * #101828 (Dark Navy Text)
 */
const BeautyManagerPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    }
  },
  semantic: {
    primary: {
      50: '#fff5f8',
      100: '#ffe5ec',
      200: '#ffb8cd',
      300: '#ff8ab1',
      400: '#ff5d8f',
      500: '#e11d48',
      600: '#c4133a',
      700: '#a80038',
      800: '#8c002f',
      900: '#700026',
      950: '#4a0019'
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.55rem',
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: '0 0 0 1px #ff5d8f, 0 0 0 4px rgba(255, 93, 143, 0.2)'
      }
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        }
      }
    }
  },
  components: {
    button: {
      root: {
        borderRadius: '{border.radius.md}',
        gap: '0.5rem',
        paddingY: '0.55rem',
        paddingX: '1rem'
      }
    },
    dialog: {
      root: {
        borderRadius: '{border.radius.xl}',
        shadow: '0 20px 40px -10px rgba(168, 0, 56, 0.18)'
      },
      header: {
        padding: '1.25rem 1.5rem'
      },
      content: {
        padding: '0 1.5rem 1.5rem 1.5rem'
      }
    },
    card: {
      root: {
        borderRadius: '{border.radius.lg}',
        shadow: '0 10px 25px rgba(168, 0, 56, 0.12)'
      }
    },
    datatable: {
      header: {
        padding: '0.85rem 1rem'
      }
    }
  }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: BeautyManagerPreset,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  },
  locale: ptBRLocale,
  ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
app.directive('tooltip', Tooltip)

app.mount('#app')
