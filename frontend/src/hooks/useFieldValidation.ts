import { useState, useCallback } from 'react';

/**
 * useFieldValidation — inline field validation hook (Apple HIG style)
 *
 * Error appears onBlur (not onChange), disappears as soon as the user
 * starts typing again. Valid state shown after a successful blur.
 *
 * Usage:
 *   const email = useFieldValidation('', (v) =>
 *     !v.includes('@') ? 'Informe um e-mail válido' : null
 *   );
 *
 *   <input
 *     value={email.value}
 *     onChange={email.onChange}
 *     onBlur={email.onBlur}
 *     className={`form-input ${email.inputClass}`}
 *   />
 *   {email.error && <span className="field-error">{email.error}</span>}
 */
export function useFieldValidation(
  initial: string,
  validate: (value: string) => string | null
) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
      // Clear error as soon as the user starts typing again
      if (error) setError(null);
    },
    [error]
  );

  const onBlur = useCallback(() => {
    setTouched(true);
    const msg = validate(value);
    setError(msg);
  }, [value, validate]);

  // Force-validate externally (e.g. on submit attempt)
  const touch = useCallback(() => {
    setTouched(true);
    const msg = validate(value);
    setError(msg);
    return msg === null;
  }, [value, validate]);

  const reset = useCallback((newValue = '') => {
    setValue(newValue);
    setError(null);
    setTouched(false);
  }, []);

  const isValid = touched && error === null && value.length > 0;

  const inputClass = error
    ? 'form-input--error'
    : isValid
    ? 'form-input--valid'
    : '';

  return {
    value,
    error,
    touched,
    isValid,
    inputClass,
    onChange,
    onBlur,
    touch,
    reset,
    // For controlled reset from parent
    setValue,
  };
}
