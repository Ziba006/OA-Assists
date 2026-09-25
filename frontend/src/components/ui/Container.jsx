export default function Container({ className = '', as: Component = 'div', ...props }) {
  return <Component className={`container-page ${className}`} {...props} />
}
