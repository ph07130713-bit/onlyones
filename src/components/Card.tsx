import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', ...props }: CardProps) {
  const classes = ['card', className].filter(Boolean).join(' ')

  return <div className={classes} {...props} />
}
