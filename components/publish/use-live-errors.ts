'use client';
import { useState } from 'react';
import type { PublishField, PublishState } from '@/app/publish/actions';

// publish-flow-v2, test variant: a field's error disappears as soon as its value
// changes, instead of staying on screen until the next submit. With enabled =
// false (the control), it returns the server's errors unchanged.
export function useLiveErrors(state: PublishState, enabled: boolean) {
  // Fields cleared since the last submit. Each submit returns a new state object,
  // so cleared fields belong to the state they were cleared on, and reset by
  // themselves when the next result arrives. No effect needed.
  const [cleared, setCleared] = useState<{ state: PublishState; fields: PublishField[] }>({
    state,
    fields: [],
  });
  const clearedFields = cleared.state === state ? cleared.fields : [];

  function clear(field: PublishField) {
    if (!enabled || clearedFields.includes(field) || !state.errors?.[field]) return;
    setCleared({ state, fields: [...clearedFields, field] });
  }

  const shown: PublishState['errors'] = enabled && state.errors
    ? Object.fromEntries(
        Object.entries(state.errors).filter(([field]) => !clearedFields.includes(field as PublishField)),
      )
    : state.errors;
  const remaining = Boolean(shown && Object.keys(shown).length);
  const fromFields = Boolean(state.errors && Object.keys(state.errors).length);
  // The top alert summarises field errors, so it goes once they're all fixed.
  // Other form errors (for example a failed save) always stay.
  const showFormError = Boolean(state.formError) && (!enabled || !fromFields || remaining);

  return { errors: shown, clear, showFormError };
}
