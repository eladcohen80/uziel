import Navbar from '../components/Navbar'
import logo from '../assets/uziel-logo.png'

export default function Homepage() {

  return (
    <div className="page">
      <Navbar />
      <h1>מיפוי מענים לתלמידים</h1>
      <h2 className="home-subtitle">בי"ס עוזיאל - קירית שמונה</h2>
      <p className="subtitle">
        ברוכים הבאים למערכת מיפוי המענים לתלמידים.
        <br />
        כאן תוכלו למלא ולעקוב אחר המענים השונים הניתנים לתלמידים בבית הספר.
      </p>
      <img className="home-logo" src={logo} alt='ביה"ס ממ"ד עוזיאל - תורנ"י מדעי' />
    </div>
  )
}
