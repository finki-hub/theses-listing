import { type ComponentProps } from '@solidjs/web';
import { omit } from 'solid-js';

import { cn } from '@/lib/cn';

export type SkeletonProps = ComponentProps<'div'>;

export const Skeleton = (props: SkeletonProps) => {
  const rest = omit(props, 'class');

  return (
    <div
      aria-hidden="true"
      class={cn('animate-pulse rounded-md bg-muted', props.class)}
      {...rest}
    />
  );
};
