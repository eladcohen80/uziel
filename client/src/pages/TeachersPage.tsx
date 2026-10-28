import Navbar from '../components/Navbar'
import TeachersTable from '../components/TeachersTable'

export default function TeachersPage() {
  return (
    <div className="page">
      <Navbar />
      <h1>צוות</h1>
      <TeachersTable />
    </div>
  )
}
