import { FCX } from '@/types/types'
import React from 'react'

type Props = {
    color: string
    name: string
    x: number
    y: number
}


export const NameLabel:FCX<Props> = ({color,name, x, y}) => {
    return (
        <div
        style={{
          position: 'absolute',
          top: y + 25,
          left: x,
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {name}
      </div>
  )
}
