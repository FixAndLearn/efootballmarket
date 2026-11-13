"use client";

import React, { useRef, useEffect, useState } from "react";

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  length = 8,
  disabled = false,
  autoFocus = true,
}: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    setDigits(arr);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, rawVal: string) => {
    const clean = rawVal.replace(/[^0-9]/g, "");

    // Handle paste or multiple characters typed
    if (clean.length > 1) {
      const chars = clean.slice(0, length).split("");
      const newDigits = [...digits];
      for (let i = 0; i < length; i++) {
        newDigits[i] = chars[i] || "";
      }
      setDigits(newDigits);
      const combined = newDigits.join("");
      onChange(combined);
      if (combined.length === length && onComplete) {
        onComplete(combined);
      }
      const targetFocus = Math.min(clean.length, length - 1);
      inputRefs.current[targetFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    const combined = newDigits.join("");
    onChange(combined);

    if (clean && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (clean && combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!pasted) return;

    const chars = pasted.split("");
    const newDigits = [...digits];
    for (let i = 0; i < length; i++) {
      newDigits[i] = chars[i] || "";
    }
    setDigits(newDigits);
    const combined = newDigits.join("");
    onChange(combined);

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
    const targetFocus = Math.min(pasted.length, length - 1);
    inputRefs.current[targetFocus]?.focus();
  };

  return (
    <div className="grid grid-cols-8 gap-1 sm:gap-2 w-full max-w-sm mx-auto">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-full h-11 sm:h-13 text-center text-base sm:text-xl font-extrabold font-mono rounded-lg sm:rounded-xl bg-sx-stone border transition-all outline-none ${
            digit
              ? "border-sx-green text-sx-ink bg-sx-green-tint shadow-sm"
              : "border-sx-border-strong text-sx-ink focus:border-sx-ink focus:ring-1 focus:ring-sx-ink"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      ))}
    </div>
  );
}
