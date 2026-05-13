import * as React from "react"
import { cn } from "@/lib/utils"

const cardVariants = ({ variant = "default", className = "" }) => {
  const base = "rounded-lg border bg-card text-card-foreground shadow-sm"
  const variants = {
    default: "",
    interactive: "cursor-pointer hover:shadow-md transition-shadow",
    elevated: "shadow-lg",
  }
  return cn(base, variants[variant], className)
}

const Card = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      className={cardVariants({ variant, className })}
      ref={ref}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      ref={ref}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      ref={ref}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      ref={ref}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("p-6 pt-0", className)}
      ref={ref}
      {...props}
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      ref={ref}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }