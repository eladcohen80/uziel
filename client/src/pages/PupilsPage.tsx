import Navbar from '../components/Navbar'
import PupilsTable from '../components/PupilsTable'

export default function PupilsPage() {
  return (
    <div className="page">
      <Navbar />
      <h1>תלמידים</h1>
      <PupilsTable />
    </div>
  )
}
