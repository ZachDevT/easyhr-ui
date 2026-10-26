"use client";

import React, { forwardRef, useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, Check, X } from "lucide-react";

export interface TimePickerProps {
  value?: string; // HH:mm in 24h format e.g. "09:00", "17:30"
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  required?: boolean;
}

const COMMON_PRESETS = [
  { label: "8:00 AM", val: "08:00" },
  { label: "9:00 AM", val: "09:00" },
  { label: "10:00 AM", val: "10:00" },
  { label: "12:00 PM", val: "12:00" },
  { label: "1:00 PM", val: "13:00" },
  { label: "2:00 PM", val: "14:00" },
  { label: "5:00 PM", val: "17:00" },
  { label: "6:00 PM", val: "18:00" },
];

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ["00", "15", "30", "45"];

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder = "Select time",
      name,
      disabled,
      className = "",
      style,
      containerStyle,
      required,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>(
      value !== undefined ? value : defaultValue !== undefined ? defaultValue : "09:00"
    );
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      if (value !== undefined) {
        setSelectedTime(value);
      }
    }, [value]);

    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Parse current hours and minutes
    const parseTime = (timeStr: string) => {
      if (!timeStr || !timeStr.includes(":")) {
        return { h24: 9, h12: 9, min: "00", period: "AM" };
      }
      const [hStr, mStr] = timeStr.split(":");
      const h24 = parseInt(hStr, 10) || 0;
      const min = mStr || "00";
      const period = h24 >= 12 ? "PM" : "AM";
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return { h24, h12, min, period };
    };

    const parsed = parseTime(selectedTime);

    const emitChange = (newTime: string) => {
      setSelectedTime(newTime);
      if (onValueChange) {
        onValueChange(newTime);
      }
      if (onChange) {
        onChange({ target: { value: newTime, name } });
      }
    };

    const handleSelectPreset = (val: string) => {
      emitChange(val);
      setIsOpen(false);
    };

    const handleHourClick = (h12: number) => {
      let h24 = h12;
      if (parsed.period === "PM" && h12 < 12) h24 = h12 + 12;
      if (parsed.period === "AM" && h12 === 12) h24 = 0;
      const newTime = `${String(h24).padStart(2, "0")}:${parsed.min}`;
      emitChange(newTime);
    };

    const handleMinuteClick = (min: string) => {
      const newTime = `${String(parsed.h24).padStart(2, "0")}:${min}`;
      emitChange(newTime);
    };

    const handlePeriodToggle = (period: "AM" | "PM") => {
      if (period === parsed.period) return;
      let h24 = parsed.h24;
      if (period === "PM" && h24 < 12) h24 += 12;
      if (period === "AM" && h24 >= 12) h24 -= 12;
      const newTime = `${String(h24).padStart(2, "0")}:${parsed.min}`;
      emitChange(newTime);
    };

    const formatDisplay = (timeStr: string) => {
      if (!timeStr) return "";
      const p = parseTime(timeStr);
      return `${p.h12}:${p.min} ${p.period}`;
    };

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          ...containerStyle,
        }}
      >
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={selectedTime}
          required={required}
        />

        {/* Trigger Button */}
        <div
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={className}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: disabled ? "#F4F4F5" : "white",
            border: `1px solid ${isOpen ? "var(--primary, #2563EB)" : "#E4E4E7"}`,
            borderRadius: "10px",
            boxShadow: isOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
            padding: "9px 12px",
            fontSize: "13.5px",
            color: disabled ? "#A1A1AA" : selectedTime ? "#18181B" : "#A1A1AA",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
            userSelect: "none",
            ...style,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock
              size={15}
              style={{
                color: isOpen ? "var(--primary, #2563EB)" : "#71717A",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {selectedTime ? formatDisplay(selectedTime) : placeholder}
            </span>
          </div>

          <ChevronDown
            size={14}
            style={{
              color: "#71717A",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s",
            }}
          />
        </div>

        {/* Dropdown Popover */}
        {isOpen && !disabled && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E4E4E7",
              boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)",
              zIndex: 9999,
              padding: "14px",
              width: "270px",
              animation: "fadeIn 0.12s ease",
            }}
          >
            {/* Quick Presets */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#71717A", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Common Hours
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                {COMMON_PRESETS.map((p) => {
                  const isPresetActive = selectedTime === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSelectPreset(p.val)}
                      style={{
                        padding: "4px 2px",
                        fontSize: 11,
                        fontWeight: isPresetActive ? 700 : 500,
                        background: isPresetActive ? "var(--primary, #2563EB)" : "#F4F4F5",
                        color: isPresetActive ? "#FFFFFF" : "#3F3F46",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #F4F4F5", paddingTop: 10 }}>
              {/* AM / PM Toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#71717A", textTransform: "uppercase" }}>
                  Select Time
                </span>
                <div style={{ display: "inline-flex", background: "#F4F4F5", borderRadius: 8, padding: 2 }}>
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle("AM")}
                    style={{
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      background: parsed.period === "AM" ? "#FFFFFF" : "transparent",
                      color: parsed.period === "AM" ? "var(--primary, #2563EB)" : "#71717A",
                      border: "none",
                      borderRadius: 6,
                      boxShadow: parsed.period === "AM" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle("PM")}
                    style={{
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      background: parsed.period === "PM" ? "#FFFFFF" : "transparent",
                      color: parsed.period === "PM" ? "var(--primary, #2563EB)" : "#71717A",
                      border: "none",
                      borderRadius: 6,
                      boxShadow: parsed.period === "PM" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Hour Grid */}
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 10.5, color: "#A1A1AA", display: "block", marginBottom: 4 }}>
                  Hour ({parsed.period})
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                  {HOURS_12.map((h) => {
                    const isSelected = parsed.h12 === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleHourClick(h)}
                        style={{
                          padding: "6px 0",
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? "var(--primary, #2563EB)" : "#F8FAFC",
                          color: isSelected ? "#FFFFFF" : "#18181B",
                          border: isSelected ? "1px solid var(--primary, #2563EB)" : "1px solid #E2E8F0",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.12s",
                        }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute Grid */}
              <div>
                <span style={{ fontSize: 10.5, color: "#A1A1AA", display: "block", marginBottom: 4 }}>
                  Minute
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {MINUTES.map((m) => {
                    const isSelected = parsed.min === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMinuteClick(m)}
                        style={{
                          padding: "6px 0",
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? "var(--primary, #2563EB)" : "#F8FAFC",
                          color: isSelected ? "#FFFFFF" : "#18181B",
                          border: isSelected ? "1px solid var(--primary, #2563EB)" : "1px solid #E2E8F0",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.12s",
                        }}
                      >
                        :{m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Confirm */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F4F4F5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11.5, color: "#71717A" }}>
                Selected: <strong style={{ color: "var(--primary, #2563EB)" }}>{formatDisplay(selectedTime)}</strong>
              </span>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 11.5, padding: "4px 12px", height: 28, borderRadius: 9999 }}
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TimePicker.displayName = "TimePicker";
export default TimePicker;
