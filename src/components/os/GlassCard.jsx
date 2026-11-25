const PADDING_CLASSES = {
  none: 'p-0',
  sm: 'p-3.5 sm:p-4',
  md: 'p-4 sm:p-5 md:p-6',
  lg: 'p-5 sm:p-7 md:p-8',
};

export default function GlassCard({
  as = 'div',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const Component = as;
  return (
    <Component
      {...rest}
      className={`os-card os-glass-surface relative overflow-hidden ${
        interactive ? 'os-card-interactive cursor-pointer' : ''
      } ${PADDING_CLASSES[padding] || PADDING_CLASSES.md} ${className}`}
    >
      {children}
    </Component>
  );
}
