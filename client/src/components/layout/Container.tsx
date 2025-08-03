import React from 'react'
import { cn } from '../../lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
}

const Container: React.FC<ContainerProps> = ({ 
  className, 
  size = 'xl', 
  children, 
  ...props 
}) => {
  const containerSizes = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md', 
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-none'
  }

  return (
    <div 
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        containerSizes[size],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export default Container