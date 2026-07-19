import { Outlet } from 'react-router-dom'
import './Chinese.css'

export default function Chinese() {
  return (
    <div className="chinese-page">
      <Outlet />
    </div>
  )
}
