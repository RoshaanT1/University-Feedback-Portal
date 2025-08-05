import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

interface ToastActionElement {
  altText?: string
}

interface ToastProps {
  id?: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default", ...props }: ToastProps) => {
    const id = (++toastCount).toString()
    
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      ...props,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)

    return {
      id,
      dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      update: (props: ToastProps) =>
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...props } : t))
        ),
    }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId ? prev.filter((t) => t.id !== toastId) : []
    )
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}

// Export a singleton toast function for convenience
let globalToast: ReturnType<typeof useToast>["toast"] | null = null

export const toast = (props: ToastProps) => {
  if (typeof window === "undefined") return

  // Create a temporary toast notification using browser's native notification
  // This is a fallback until a proper toast provider is implemented
  if (props.variant === "destructive") {
    console.error(`${props.title}: ${props.description}`)
    alert(`Error: ${props.title}\n${props.description}`)
  } else {
    console.log(`${props.title}: ${props.description}`)
    // For non-destructive toasts, we can show a simple alert or just log
    // In a real app, you'd want to implement a proper toast UI component
    if (props.title === "Feedback Submitted") {
      alert(`${props.title}\n${props.description}`)
    }
  }
}
