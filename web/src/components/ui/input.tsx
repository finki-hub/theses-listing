import { ChevronDown } from '@lucide/solid';
import { type ComponentProps } from '@solidjs/web';
import { omit } from 'solid-js';

import { cn } from '@/lib/cn';

const controlClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export type InputProps = ComponentProps<'input'>;

export const Input = (props: InputProps) => {
  const rest = omit(props, 'class');

  return (
    <input
      class={cn(controlClass, props.class)}
      {...rest}
    />
  );
};

export type NativeSelectProps = ComponentProps<'select'>;

export const NativeSelect = (props: NativeSelectProps) => {
  const rest = omit(props, 'class');

  return (
    // A drawn arrow: browsers place the native one ignoring the padding.
    <span class="relative block">
      <select
        class={cn(
          controlClass,
          'cursor-pointer appearance-none truncate pr-8',
          props.class,
        )}
        {...rest}
      />
      <ChevronDown
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
};
