import { Link } from 'react-router-dom'
export default function NotFound(){
  return (
    <div className="container">
      <div className="card">
        <h2>Страница не найдена</h2>
        <Link to="/">На главную</Link>
      </div>
    </div>
  )
}
