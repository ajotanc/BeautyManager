import { useConfirm } from 'primevue/useconfirm'

export interface AppConfirmOptions {
  message: string
  header?: string
  icon?: string
  severity?: 'success' | 'warning' | 'error' | 'info'
  acceptLabel?: string
  rejectLabel?: string
  accept?: () => void
  reject?: () => void
}

export function useAppConfirm() {
  const confirm = useConfirm()

  const requireConfirm = (options: AppConfirmOptions) => {
    let buttonSeverity = 'primary'
    if (options.severity === 'error') buttonSeverity = 'danger'
    else if (options.severity === 'warning') buttonSeverity = 'warn'
    else if (options.severity === 'success') buttonSeverity = 'success'
    else if (options.severity === 'info') buttonSeverity = 'info'

    confirm.require({
      message: options.message,
      header: options.header || 'Confirmar Ação',
      icon: options.icon,
      acceptProps: {
        severity: buttonSeverity,
        label: options.acceptLabel || 'Confirmar'
      },
      rejectProps: {
        severity: 'secondary',
        label: options.rejectLabel || 'Cancelar',
        variant: 'text'
      },
      accept: options.accept,
      reject: options.reject
    })
  }

  return { requireConfirm }
}
