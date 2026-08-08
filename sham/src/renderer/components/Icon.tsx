import React from 'react';
import { getIconComponent, IconName } from './icons';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, color, className, style }: IconProps): React.JSX.Element {
  const Component = getIconComponent(name);
  return (
    <Component
      size={size}
      color={color}
      className={className}
      style={style}
    />
  );
}
