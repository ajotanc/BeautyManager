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

import App from './App.vue'
import router from './router'

/**
 * Custom Preset PrimeVue - Paleta Oficial:
 * #D7263D (Crimson / Ruby Dark)
 * #FF4D6D (Vibrant Coral Rose / Primary)
 * #FF8FA3 (Soft Rose / Focus & Accent)
 * #FFF0F3 (Blush White / Clean Surface)
 * #2B2D42 (Dark Slate Navy / Charcoal Text)
 */
const BeautyManagerPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px'
    }
  },
  semantic: {
    primary: {
      50: '#fff0f3',
      100: '#ffe3e8',
      200: '#ffccd5',
      300: '#ffa6b7',
      400: '#ff8fa3',
      500: '#ff4d6d',
      600: '#e63956',
      700: '#d7263d',
      800: '#b01a2e',
      900: '#871322',
      950: '#4f0611'
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.55rem',
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '1px',
        style: 'solid',
        color: '#ff8fa3',
        offset: '0',
        shadow: '0 0 0 3px rgba(255, 77, 109, 0.15)'
      }
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#2b2d42',
          900: '#1e293b',
          950: '#0f172a'
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
        shadow: '0 20px 45px -10px rgba(43, 45, 66, 0.18)'
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
        shadow: '0 4px 16px rgba(43, 45, 66, 0.05)'
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
  ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)
app.directive('tooltip', Tooltip)

app.mount('#app')
