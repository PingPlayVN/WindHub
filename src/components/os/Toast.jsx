import { Toaster } from 'sonner';
import { useThemeStore } from '@/store/useThemeStore';

export default function Toast() {
  const theme = useThemeStore((state) => state.theme);
  const liquidGlass = useThemeStore((state) => state.liquidGlass);

  return (
    <Toaster
      position="top-right"
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '16px',
          border: '1px solid var(--os-border-default)',
          background: liquidGlass ? 'var(--os-surface-floating)' : 'var(--os-surface-1)',
          color: 'var(--os-text-primary)',
          backdropFilter: liquidGlass ? 'blur(20px) saturate(170%)' : undefined,
          boxShadow: 'var(--os-shadow-md)',
          fontFamily: 'var(--font-sans)',
        },
      }}
    />
  );
}
