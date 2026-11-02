import Navbar from '../components/Navbar'
import TeachersTable from '../components/TeachersTable'

export default function TeachersPage() {
  return (
    <div className="page teachers-page">
      <Navbar />
      <h1>צוות</h1>
      <TeachersTable />
    </div>
  )
}
