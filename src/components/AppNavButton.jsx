import { useNavigate } from 'react-router-dom'

export default function AppNavButton({
  to,
  children,
  className = '',
  replace = false,
  onClick,
  ...rest
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        onClick?.(event)
        navigate(to, { replace })
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
