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
 * Custom Preset PrimeVue - Paleta Hot Pink (Boutique):
 * #FD0054 (Hot Pink)
 * #800832 (Burgundy)
 * #FFB4C7 (Pale Pink)
 * #05081F (Dark Navy)
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
      50: '#ffebf0',
      100: '#ffb4c7',
      200: '#ffa3bc',
      300: '#fd6b91',
      400: '#fc3671',
      500: '#fd0054',
      600: '#d90048',
      700: '#800832',
      800: '#420419',
      900: '#05081f',
      950: '#02040d'
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
        shadow: '0 0 0 1px #fd6b91, 0 0 0 4px rgba(253, 107, 145, 0.2)'
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
      darkModeSelector: false,
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue'
      }
    }
  },
  zIndex: {
    modal: 1100,
    overlay: 1200,
    menu: 1200,
    tooltip: 1300,
    toast: 1400
  },
  locale: ptBRLocale,
  ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
app.directive('tooltip', Tooltip)

app.mount('#app')
