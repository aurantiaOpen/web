import { Routes, Route } from 'react-router-dom'
import ParentComponent from './pages/ParentComponent'
import HomePage from './pages/HomePage'
import EventDetails from './pages/EventDetails'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ParentComponent />}>
        <Route index element={<HomePage />} />
        <Route path="categorie/:catSlug" element={<CategoryPage />} />
        <Route path="eventi/:id" element={<EventDetails />} />
        <Route path="cerca" element={<SearchPage />} />
      </Route>
    </Routes>
  )
}
