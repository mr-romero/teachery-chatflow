import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export type ChoiceFormat = 'letters' | 'fghj' | 'custom';

interface ChoiceFormatSelectProps {
  value: ChoiceFormat;
  onValueChange: (value: ChoiceFormat) => void;
  disabled?: boolean;
}

export const CHOICE_FORMATS = {
  letters: ['A', 'B', 'C', 'D'],
  fghj: ['F', 'G', 'H', 'J'],
} as const;

export function ChoiceFormatSelect({ value, onValueChange, disabled }: ChoiceFormatSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as ChoiceFormat)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="letters">A, B, C, D</SelectItem>
        <SelectItem value="fghj">F, G, H, J</SelectItem>
        <SelectItem value="custom">Custom Labels</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function getDefaultChoices(format: ChoiceFormat = 'letters') {
  if (format === 'custom') {
    return Array(4).fill('').map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      isCorrect: false,
      label: String(i + 1)
    }));
  }

  const labels = CHOICE_FORMATS[format] || CHOICE_FORMATS.letters;
  return labels.map(label => ({
    id: Math.random().toString(36).substr(2, 9),
    text: '',
    isCorrect: false,
    label
  }));
}
