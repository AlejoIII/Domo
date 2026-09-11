import { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/cn';

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VerificationCodeInput({ value, onChange, disabled }: VerificationCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const updateDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, 6));
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) onChange(pasted);
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => updateDigit(i, e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'h-12 w-10 rounded-lg border border-border/70 bg-card text-center text-lg font-semibold',
            'outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
            disabled && 'opacity-50',
          )}
        />
      ))}
    </div>
  );
}
