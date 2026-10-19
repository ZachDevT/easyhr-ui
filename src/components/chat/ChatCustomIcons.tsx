"use client";

import React from 'react';

interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Modern, non-generic GIF badge icon.
 * Replaces generic sparkles with an authentic, crisp [GIF] container badge
 * aligned with industry standards (Slack, Discord, Twitter/X).
 */
export function GifIcon({
  size = 15,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Outer rounded badge */}
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="4"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Letter 'G' */}
      <path
        d="M9 9.5H7.2C5.9 9.5 5 10.4 5 11.6V12.4C5 13.6 5.9 14.5 7.2 14.5H9V12H7.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Letter 'I' */}
      <path
        d="M12 9.5V14.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Letter 'F' */}
      <path
        d="M15 14.5V9.5H18.5M15 12H17.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Kinetic, non-generic Animated Emoji icon.
 * Replaces generic lightning bolt (Zap) with a lively, expressive emoji face
 * featuring kinetic motion ripples and dynamic sparkle burst.
 */
export function AnimatedEmojiIcon({
  size = 15,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Lively smiley head */}
      <circle
        cx="12"
        cy="12"
        r="7.2"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Playful winking eye (left) */}
      <path
        d="M8.5 10.2C9 9.5 10 9.5 10.5 10.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Spark/star pupil (right) */}
      <circle
        cx="14.5"
        cy="10"
        r="1"
        fill={color}
      />
      {/* Big energetic smile */}
      <path
        d="M9 13.5C9.6 15.3 14.4 15.3 15 13.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Kinetic motion ripple waves (left) */}
      <path
        d="M2.5 9.5C1.8 11 1.8 13 2.5 14.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Kinetic motion ripple waves (right) */}
      <path
        d="M21.5 9.5C22.2 11 22.2 13 21.5 14.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Animation sparkle burst (top right) */}
      <path
        d="M19 2.5V6.5M17 4.5H21"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
