import { buttonClasses } from './buttonStyles'

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />
}
