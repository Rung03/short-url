import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

// QR is always dark-on-white so phone cameras can read it in any theme.
export default function QrBlock({ value, fileName = 'qr-code', size = 180 }) {
  const canvasRef = useRef(null)

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${fileName}.png`
    a.click()
  }

  return (
    <div className="qr-block">
      <div className="qr-frame">
        <QRCodeCanvas
          ref={canvasRef}
          value={value}
          size={size * 2}
          marginSize={2}
          level="M"
          bgColor="#ffffff"
          fgColor="#111827"
          style={{ width: size, height: size }}
        />
      </div>
      <button type="button" className="btn btn-secondary" onClick={download}>
        ดาวน์โหลด PNG
      </button>
    </div>
  )
}
