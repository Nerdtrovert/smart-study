import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import HomePage from './pages/HomePage'
import NotesPage from './pages/NotesPage'
import SubjectPage from './pages/SubjectPage'
import PYQsPage from './pages/PYQsPage'
import PYQSubjectPage from './pages/PYQSubjectPage'
import AdminPanel from './components/admin/AdminPanel'
import Footer from './components/shared/Footer'

function AppLayout() {
  const { pathname } = useLocation()
  const showFooter = pathname === '/'

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/scheme/:schemeId/semester/:semester" element={<NotesPage />} />
        <Route path="/notes/:subjectId" element={<SubjectPage />} />
        <Route path="/pyqs" element={<PYQsPage />} />
        <Route path="/pyqs/scheme/:schemeId/semester/:semester" element={<PYQsPage />} />
        <Route path="/pyqs/:subjectId" element={<PYQSubjectPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
