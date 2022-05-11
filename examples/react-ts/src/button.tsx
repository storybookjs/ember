import React, { ComponentType, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * A label to show on the button
   */
  label: string;

  /**
   * An icon to show on the left of the label
   */
  icon?: ComponentType;
}

export const Button = ({ label = 'Hello', icon: Icon, ...props }: ButtonProps) => (
  <button type="button" {...props}>
    {Icon ? <Icon /> : null} {label}
  </button>
);
