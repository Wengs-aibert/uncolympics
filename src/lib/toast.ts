import { useToastStore } from '../stores/toastStore'

export const toast = {
  error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
}