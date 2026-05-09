import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiHome, HiSearch, HiFilm, HiStar, HiAcademicCap,
  HiVideoCamera, HiPhotograph, HiCollection, HiLightningBolt
} from 'react-icons/hi'

const CATEGORIES = [
  { id: 1, label: 'Documentari', slug: 'documentari', icon: HiFilm },
  { id: 2, label: 'Eventi', slug: 'eventi-cat', icon: HiStar },
  { id: 3, label: 'Sport', slug: 'sport', icon: HiLightningBolt },
  { id: 4, label: 'Trasmissioni', slug: 'trasmissioni', icon: HiVideoCamera },
  { id: 5, label: 'Video Lezioni', slug: 'video-lezioni', icon: HiAcademicCap },
  { id: 7, label: 'Shorts', slug: 'shorts', icon: HiPhotograph },
]

export default function Sidebar() {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const expanded = hovered

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ width: expanded ? 260 : 84 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 h-full z-40 bg-gray-900/95 backdrop-blur-md border-r border-gray-800 overflow-hidden hidden md:flex flex-col py-6"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 mb-8 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <span className="text-2xl flex-shrink-0">🍊</span>
        <AnimatedText show={expanded} className="text-xl font-bold text-orange-500 whitespace-nowrap">
          aranciaOpen
        </AnimatedText>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3">
        <SidebarItem
          icon={HiHome}
          label="Home"
          expanded={expanded}
          active={location.pathname === '/'}
          onClick={() => navigate('/')}
        />
        <SidebarItem
          icon={HiSearch}
          label="Cerca"
          expanded={expanded}
          active={location.pathname === '/cerca'}
          onClick={() => navigate('/cerca')}
        />
        <SidebarItem
          icon={HiCollection}
          label="Categorie"
          expanded={expanded}
          active={false}
          onClick={() => {}}
          noClick
        />
      </nav>

      {/* Categories */}
      <div className="flex flex-col gap-1 px-3 mt-2">
        {CATEGORIES.map((cat) => {
          const isActive = location.pathname === `/categorie/${cat.slug}`
          return (
            <SidebarItem
              key={cat.id}
              icon={cat.icon}
              label={cat.label}
              expanded={expanded}
              active={isActive}
              onClick={() => navigate(`/categorie/${cat.slug}`)}
              indent
            />
          )
        })}
      </div>

      {/* Bottom */}
      <div className="mt-auto px-5">
        <AnimatedText show={expanded} className="text-xs text-gray-600 whitespace-nowrap">
          🍊 aranciaOpen v0.1
        </AnimatedText>
      </div>
    </motion.aside>
  )
}

function SidebarItem({ icon: Icon, label, expanded, active, onClick, indent, noClick }) {
  return (
    <button
      onClick={noClick ? undefined : onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left
        ${active ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
        ${indent ? 'pl-5' : ''}
        ${noClick ? 'cursor-default opacity-60' : 'cursor-pointer'}
      `}
    >
      <Icon className="text-lg flex-shrink-0" />
      <AnimatedText show={expanded} className="text-sm whitespace-nowrap font-medium">
        {label}
      </AnimatedText>
    </button>
  )
}

function AnimatedText({ show, children, className }) {
  return (
    <motion.span
      animate={{ opacity: show ? 1 : 0, width: show ? 'auto' : 0 }}
      transition={{ duration: 0.2 }}
      className={`overflow-hidden ${className || ''}`}
    >
      {children}
    </motion.span>
  )
}
