import type { ClassValue } from 'clsx';

import { type ComponentProps } from '@solidjs/web';
import { omit } from 'solid-js';

import { cn } from '@/lib/cn';

export type ButtonSize = 'default' | 'icon' | 'sm';
export type ButtonVariant = 'default' | 'ghost' | 'outline';

const baseClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  ghost: 'hover:bg-muted hover:text-foreground',
  outline:
    'border border-input bg-background shadow-sm hover:bg-muted hover:text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  icon: 'size-10',
  sm: 'h-9 px-3',
};

export const buttonVariants = (
  options: {
    class?: ClassValue;
    size?: ButtonSize;
    variant?: ButtonVariant;
  } = {},
) =>
  cn(
    baseClass,
    variantClasses[options.variant ?? 'default'],
    sizeClasses[options.size ?? 'default'],
    options.class,
  );

export type ButtonProps = ComponentProps<'button'> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const Button = (props: ButtonProps) => {
  const rest = omit(props, 'class', 'size', 'type', 'variant');

  return (
    <button
      class={buttonVariants({
        class: props.class,
        size: props.size,
        variant: props.variant,
      })}
      type={props.type ?? 'button'}
      {...rest}
    />
  );
};
