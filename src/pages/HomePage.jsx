import HeroBanner from './HeroBanner'
import EventRow from './EventRow'

const CATEGORIES = [
  { id: 1, label: 'Documentari', slug: 'documentari' },
  { id: 2, label: 'Eventi', slug: 'eventi-cat' },
  { id: 3, label: 'Sport', slug: 'sport' },
  { id: 4, label: 'Trasmissioni', slug: 'trasmissioni' },
  { id: 5, label: 'Video Lezioni', slug: 'video-lezioni' },
  { id: 7, label: 'Shorts', slug: 'shorts' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroBanner />
      <div className="space-y-6 md:space-y-10 py-6 md:py-10">
        {CATEGORIES.map((cat) => (
          <EventRow key={cat.id} categoryId={cat.id} categoryLabel={cat.label} categorySlug={cat.slug} />
        ))}
      </div>
    </div>
  )
}
