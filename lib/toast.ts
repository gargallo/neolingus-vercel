// Toast utility with fallback for sonner
// This provides a consistent interface for toast notifications

interface ToastInterface {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// Check if we're in a browser environment and sonner is available
const createToast = async (): Promise<ToastInterface> => {
  if (typeof window !== 'undefined') {
    try {
      // Try to use sonner if available
      const { toast: sonnerToast } = await import('sonner');
      return {
        success: (message: string) => sonnerToast.success(message),
        error: (message: string) => sonnerToast.error(message),
        info: (message: string) => sonnerToast.info(message),
        warning: (message: string) => sonnerToast.warning(message),
      };
    } catch (_err) {
      // Fall back to console logging if sonner is not available
      console.warn('Sonner not available, falling back to console logging');
    }
  }

  // Fallback implementation using console
  return {
    success: (message: string) => {
      console.log('✅ SUCCESS:', message);
      // You could also implement browser notifications here
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Optional: Show browser notification
      }
    },
    error: (message: string) => {
      console.error('❌ ERROR:', message);
    },
    info: (message: string) => {
      console.info('ℹ️ INFO:', message);
    },
    warning: (message: string) => {
      console.warn('⚠️ WARNING:', message);
    },
  };
};

// Create the toast instance
let toastInstance: Promise<ToastInterface> | null = null;

const getToast = (): Promise<ToastInterface> => {
  if (!toastInstance) {
    toastInstance = createToast();
  }
  return toastInstance;
};

// Export wrapper functions that handle the async nature
export const toast = {
  success: async (message: string) => {
    const toast = await getToast();
    toast.success(message);
  },
  error: async (message: string) => {
    const toast = await getToast();
    toast.error(message);
  },
  info: async (message: string) => {
    const toast = await getToast();
    toast.info(message);
  },
  warning: async (message: string) => {
    const toast = await getToast();
    toast.warning(message);
  },
};