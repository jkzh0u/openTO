'use client'
import { useEffect, useState } from 'react'

import TPS from "./components/TPS"
import TTC from "./components/TTC"
import FIRE from "./components/FIRE"
export default function Home() {
  const [message, setMessage] = useState()

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/hello')
      const { message } = await res.json()
      setMessage(message)
    }
    fetchData()
  }, [])

  if (!message) return <p>Loading...</p>

  return (
    <div>
    <TPS></TPS>
    <TTC></TTC>
    <FIRE></FIRE>
    </div>
  )
}
