import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/cn';

const controlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export type InputProps = ComponentProps<'input'>;

export const Input = (props: InputProps) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <input
      class={cn(controlClass, local.class)}
      {...rest}
    />
  );
};

export type NativeSelectProps = ComponentProps<'select'>;

export const NativeSelect = (props: NativeSelectProps) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <select
      class={cn(controlClass, 'cursor-pointer pr-2', local.class)}
      {...rest}
    />
  );
};
