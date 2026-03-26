'use client';

interface FieldErrorProps {
  errors?: string[];
}

export default function FieldError({ errors }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-0.5">
      {errors.map((msg, i) => (
        <p key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
          <span className="mt-0.5 w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
          {msg}
        </p>
      ))}
    </div>
  );
}
