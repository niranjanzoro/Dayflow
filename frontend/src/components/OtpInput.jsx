import { useEffect, useRef } from 'react';

/**
 * Six-box one-time-code input.
 * Auto-advances on type, supports paste of the full code, and moves
 * focus back on Backspace. Calls onComplete(code) once all digits are set.
 */
export default function OtpInput({ value, onChange, onComplete, disabled = false, error = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (!disabled) refs.current[0]?.focus();
  }, [disabled]);

  const commit = (code) => {
    const clean = code.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
  };

  const handleChange = (index, raw) => {
    const chars = raw.replace(/\D/g, '');
    if (!chars) return;
    const next = [...digits];
    chars.split('').every((char, offset) => {
      if (index + offset >= 6) return false;
      next[index + offset] = char;
      return true;
    });
    commit(next.join(''));
    const target = Math.min(index + chars.length, 5);
    refs.current[target]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = '';
      } else if (index > 0) {
        next[index - 1] = '';
        refs.current[index - 1]?.focus();
      }
      commit(next.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      commit(pasted);
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className={`otp-row${error ? ' otp-error' : ''}`} role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="otp-box"
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
