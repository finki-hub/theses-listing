import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/cn';

export type SkeletonProps = ComponentProps<'div'>;

export const Skeleton = (props: SkeletonProps) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      aria-hidden="true"
      class={cn('animate-pulse rounded-md bg-muted', local.class)}
      {...rest}
    />
  );
};
