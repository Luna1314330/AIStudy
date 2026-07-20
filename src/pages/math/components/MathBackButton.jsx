import AppNavButton from '@/components/AppNavButton'
import './MathBackButton.css'

export default function MathBackButton({ to, children, className = '' }) {
  return (
    <AppNavButton
      to={to}
      replace
      className={`math-back-btn${className ? ` ${className}` : ''}`}
    >
      {children}
    </AppNavButton>
  )
}
