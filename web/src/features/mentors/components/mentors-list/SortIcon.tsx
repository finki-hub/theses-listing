import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/solid';
import { Show } from 'solid-js';

import type { SortIconProps } from './types';

const SortIcon = (props: SortIconProps) => (
  <Show
    fallback={
      <ArrowUpDown
        aria-hidden="true"
        class="ml-1 inline-block h-4 w-4"
      />
    }
    when={props.currentField === props.field}
  >
    <Show
      fallback={
        <ArrowDown
          aria-hidden="true"
          class="ml-1 inline-block h-4 w-4"
        />
      }
      when={props.currentDirection === 'asc'}
    >
      <ArrowUp
        aria-hidden="true"
        class="ml-1 inline-block h-4 w-4"
      />
    </Show>
  </Show>
);

export default SortIcon;
