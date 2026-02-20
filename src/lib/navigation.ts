// Navigation ref for use outside React component tree (e.g., sync.ts)
// Set by App.tsx on mount, consumed by realtime handlers

let navigateFn: ((path: string) => void) | null = null;

export function setNavigate(fn: (path: string) => void) {
  navigateFn = fn;
}

export function appNavigate(path: string) {
  if (navigateFn) {
    navigateFn(path);
  } else {
    // Fallback only if React Router hasn't mounted yet
    window.location.href = path;
  }
}
