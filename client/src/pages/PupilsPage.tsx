import Navbar from '../components/Navbar'
import PupilsTable from '../components/PupilsTable'
import PupilsFilterProvider from '../components/PupilsFilterProvider'

export default function PupilsPage() {
  return (
    <div className="page pupils-page">
      {/* פקדי הסינון של הטבלה מוצגים בנאבאר, לכן שניהם עטופים באותו provider */}
      <PupilsFilterProvider>
        <Navbar />
        <PupilsTable />
      </PupilsFilterProvider>
    </div>
  )
}
