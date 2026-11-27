export function initAppHeightSync(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const updateHeight = () => {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (height > 0) {
      document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
    }
  };

  updateHeight();
  window.addEventListener('resize', updateHeight, { passive: true });
  window.addEventListener('orientationchange', updateHeight, { passive: true });
  window.visualViewport?.addEventListener('resize', updateHeight, { passive: true });

  return () => {
    window.removeEventListener('resize', updateHeight);
    window.removeEventListener('orientationchange', updateHeight);
    window.visualViewport?.removeEventListener('resize', updateHeight);
  };
}

export function bindDrillInterruptionGuards(
  container: HTMLElement | null,
  onShouldPause: (reason: 'visibility-hidden' | 'window-blur' | 'orientation-change') => void,
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const preventMultiTouchZoom = (e: TouchEvent) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  };

  const preventGesture = (e: Event) => {
    e.preventDefault();
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      onShouldPause('visibility-hidden');
    }
  };

  const onBlur = () => {
    onShouldPause('window-blur');
  };

  const onOrientation = () => {
    onShouldPause('orientation-change');
  };

  if (container) {
    container.addEventListener('touchmove', preventMultiTouchZoom, { passive: false });
    container.addEventListener('gesturestart', preventGesture, { passive: false });
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('blur', onBlur);
  window.addEventListener('orientationchange', onOrientation);

  return () => {
    if (container) {
      container.removeEventListener('touchmove', preventMultiTouchZoom);
      container.removeEventListener('gesturestart', preventGesture);
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('orientationchange', onOrientation);
  };
}
