import { useParams, useNavigate } from 'react-router-dom'
import { HiChevronLeft } from 'react-icons/hi'
import EventsGrid from './EventsGrid'

const CATEGORY_MAP = {
  'documentari': { id: 1, label: 'Documentari' },
  'eventi-cat': { id: 2, label: 'Eventi' },
  'sport': { id: 3, label: 'Sport' },
  'trasmissioni': { id: 4, label: 'Trasmissioni' },
  'video-lezioni': { id: 5, label: 'Video Lezioni' },
  'shorts': { id: 7, label: 'Shorts' },
  'tutti': { id: null, label: 'Tutti i Contenuti' },
}

export default function CategoryPage() {
  const { catSlug } = useParams()
  const navigate = useNavigate()
  const category = CATEGORY_MAP[catSlug] || { id: null, label: catSlug }

  return (
    <div className="min-h-screen px-6 md:px-10 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <HiChevronLeft className="text-2xl" />
        </button>
        <h1 className="text-3xl font-bold text-white">{category.label}</h1>
      </div>

      <EventsGrid categoryId={category.id} />
    </div>
  )
}
