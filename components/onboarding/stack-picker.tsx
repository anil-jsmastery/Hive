'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { STACKS, type Stack } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { saveStack } from '@/app/onboarding/actions';

export function StackPicker() {
  const [stack, setStack] = useState<Stack | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <RadioGroup
        value={stack ?? ''}
        onValueChange={(value) => setStack(value as Stack)}
        className="sm:grid-cols-2"
      >
        {STACKS.map((option) => {
          const id = `stack-${option}`;
          return (
            <Label
              key={option}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-4 text-base',
                stack === option && 'border-primary',
              )}
            >
              <RadioGroupItem id={id} value={option} />
              {option}
            </Label>
          );
        })}
      </RadioGroup>
      <div className="flex items-center gap-3">
        <Button
          disabled={!stack || pending}
          onClick={() => {
            if (!stack) return;
            startTransition(async () => {
              await saveStack(stack);
            });
          }}
        >
          {pending ? 'Saving…' : 'Continue'}
        </Button>
        <Link href="/explore" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Skip for now
        </Link>
      </div>
    </div>
  );
}
