'use client'

import { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { Users } from 'lucide-react'

interface StudentCounterProps {
  className?: string
  iconClassName?: string
  suffix?: string
  prefix?: string
  showIcon?: boolean
}

export default function StudentCounter({
  className = '',
  iconClassName = 'w-5 h-5 text-[#A855F7]',
  suffix = '+ Students',
  prefix = '',
  showIcon = true
}: StudentCounterProps) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'
        const res = await fetch(`${baseUrl}/api/auth/count`)
        if (res.ok) {
          const data = await res.json()
          setCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching student count:', error)
      }
    }

    fetchUserCount()
  }, [])

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Users strokeWidth={1.5} className={iconClassName} />}
      <span>
        {prefix}
        {count !== null ? (
          <CountUp end={count} duration={2.5} separator="," />
        ) : (
          0
        )}
        {suffix}
      </span>
    </span>
  )
}
