import Navbar from '../components/Navbar'
import TeacherForm from '../components/TeacherForm'

export default function TeacherFormPage() {
  return (
    <div className="page">
      <Navbar />
      <h1>טופס מורה</h1>
      <TeacherForm />
    </div>
  )
}
