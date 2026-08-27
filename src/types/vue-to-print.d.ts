import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

export interface Font {
  family: string
  source: string
  weight?: string
  style?: string
}

export type PropertyFunction<T> = () => T

export interface UseVueToPrintProps {
  bodyClass: MaybeRefOrGetter<string>
  content: MaybeRefOrGetter<HTMLElement | ComponentPublicInstance | null | undefined>
  copyStyles: MaybeRefOrGetter<boolean>
  documentTitle: MaybeRefOrGetter<string>
  fonts: MaybeRefOrGetter<Font[]>
  onAfterPrint: MaybeRefOrGetter<() => void>
  onBeforeGetContent: MaybeRefOrGetter<() => void | Promise<void>>
  onBeforePrint: MaybeRefOrGetter<() => void | Promise<void>>
  onPrintError: MaybeRefOrGetter<(
    errorLocation: 'onBeforeGetContent' | 'onBeforePrint' | 'print',
    error: Error
  ) => void>
  pageStyle: MaybeRefOrGetter<string | PropertyFunction<string>>
  print: MaybeRefOrGetter<(target: HTMLIFrameElement) => Promise<void>>
  removeAfterPrint: MaybeRefOrGetter<boolean>
  suppressErrors: MaybeRefOrGetter<boolean>
  nonce: MaybeRefOrGetter<string>
}

// content is required, other props are optional
export type PublicUseVueToPrintProps =
  Partial<Omit<UseVueToPrintProps, 'content'>>
  & Pick<UseVueToPrintProps, 'content'>

declare module 'vue-to-print' {
  export function useVueToPrint(
    options: PublicUseVueToPrintProps
  ): { handlePrint: () => void }

  export const VueToPrint: import('vue').DefineComponent<PublicUseVueToPrintProps>
}
