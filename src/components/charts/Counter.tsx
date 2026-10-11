import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

/** Animated numeric readout — springs from previous value to the next. */
export function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(0)
  const text = useTransform(() => format(mv.get()))

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, mv])

  return <motion.span className="tabular">{text}</motion.span>
}
