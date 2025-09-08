import React from 'react'
import { cn } from '../utils/utils';

const Container = ({ children, className }: {
  children: React.ReactNode;
  className?: string
}) => {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 md:py-8 w-full z-10", className)}>{children}</div>
  )
}

export default Container