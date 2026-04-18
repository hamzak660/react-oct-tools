// import * as React from 'react'
// const { useMemo, useState, useCallback, useRef } = React
import React, { useMemo, useState, useCallback, useRef } from "react";
import { createRoot } from 'react-dom/client'
import { useWavesurfer } from '@wavesurfer/react'
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js'

const audioUrls = [
  'aaa.mp3',
]

const formatTime = (seconds) => [seconds / 60, seconds % 60].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

export default function Audioeditor() {
   const containerRef = useRef(null)
  const [urlIndex, setUrlIndex] = useState(0)

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: '#6a6c03',
    progressColor: '#bbbf0c',
    url: audioUrls[urlIndex],
    scrollParent: true,   //  enables horizontal scroll
    autoCenter: false,    //  prevents weird jumping
    plugins: useMemo(() => [Timeline.create()], []),
  })

  const onUrlChange = useCallback(() => {
    setUrlIndex((index) => (index + 1) % audioUrls.length)
  }, [])

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause()
  }, [wavesurfer])
const [zoom, setZoom] = useState(100)
const onZoomChange = useCallback((e) => {
  const value = Number(e.target.value)
  setZoom(value)

  if (wavesurfer) {
    wavesurfer.zoom(value)
  }
}, [wavesurfer])
  return (
  	  <>
  	  <label>
  Zoom:
  <input
    type="range"
    min="10"
    max="500"
    value={zoom}
    onChange={onZoomChange}
  />
</label>
<div className="wave-container custom-scrollbar">
   <div ref={containerRef} />
   </div>

      <p>Current audio: {audioUrls[urlIndex]}</p>

      <p>Current time: {formatTime(currentTime)}</p>

      <div style={{ margin: '1em 0', display: 'flex', gap: '1em' }}>
        <button onClick={onUrlChange}>Change audio</button>

        <button onClick={onPlayPause} style={{ minWidth: '5em' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      </>  
  );
}