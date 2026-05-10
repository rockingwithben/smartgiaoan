import React from 'react';
import { cn } from '../lib/utils';

export function Container({ as: Component = 'div', className, children }) {
  return (
    <Component className={cn('max-w-7xl mx-auto px-6 lg:px-10', className)}>
      {children}
    </Component>
  );
}