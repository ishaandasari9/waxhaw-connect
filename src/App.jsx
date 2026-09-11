import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Accessibility, ArrowLeft, ArrowRight, Baby, BadgeCheck, Bookmark, BriefcaseBusiness,
  Building2, Bus, CalendarDays, Check, ChevronDown, CircleAlert, Clock3, Compass,
  ExternalLink, Eye, FileDown, Filter, Globe2, GraduationCap, HandHeart, HeartPulse,
  Home, House, Info, Languages, Leaf, MapPin, Menu, Minus, Phone, Plus, Printer,
  Search, ShieldCheck, Sparkles, TreePine, Users, Utensils, X, Zap,
} from 'lucide-react'
import { categories, events, resources, sourceNotes, urgentLinks } from './data'

const AppContext = createContext(null)

const copy = {
  en: {
    resources: 'Resources', events: 'Events', finder: 'Guided finder', about: 'About', saved: 'Saved',
    location: 'Waxhaw, North Carolina', tagline: 'A stronger community, together.',
    hero: 'Find support. Join in. Feel at home.',
    heroSub: 'Trusted local resources, events and opportunities for every stage of life in Waxhaw.',
    searchLabel: 'Search community resources', searchPlaceholder: 'What can we help you find?', search: 'Search',
    urgent: 'Urgent help', urgentSub: 'Get immediate support or find crisis resources in Waxhaw and Union County.',
    explore: 'Explore resources', exploreSub: 'Browse by topic or find what you need quickly.',
    guide: 'Help me choose', guideSub: 'Not sure where to start? Answer a few quick questions and we’ll suggest resources.',
    verified: 'Verified source', checked: 'Information checked', viewDetails: 'View details', save: 'Save', savedVerb: 'Saved',
    upcoming: 'Upcoming in Waxhaw', viewAll: 'View all resources', openNow: 'Open now', closedNow: 'Closed now',
  },
  es: {
    resources: 'Recursos', events: 'Eventos', finder: 'Guía personalizada', about: 'Acerca de', saved: 'Guardados',
    location: 'Waxhaw, Carolina del Norte', tagline: 'Una comunidad más fuerte, unida.',
    hero: 'Encuentre apoyo. Participe. Siéntase en casa.',
    heroSub: 'Recursos, eventos y oportunidades locales confiables para cada etapa de la vida en Waxhaw.',
    searchLabel: 'Buscar recursos comunitarios', searchPlaceholder: '¿Qué podemos ayudarle a encontrar?', search: 'Buscar',
    urgent: 'Ayuda urgente', urgentSub: 'Encuentre apoyo inmediato y recursos de crisis en Waxhaw y Union County.',
    explore: 'Explore recursos', exploreSub: 'Busque por tema o encuentre rápidamente lo que necesita.',
    guide: 'Ayúdeme a elegir', guideSub: '¿No sabe por dónde empezar? Responda algunas preguntas y le sugeriremos recursos.',
    verified: 'Fuente verificada', checked: 'Información revisada', viewDetails: 'Ver detalles', save: 'Guardar', savedVerb: 'Guardado',
    upcoming: 'Próximamente en Waxhaw', viewAll: 'Ver todos los recursos', openNow: 'Abierto ahora', closedNow: 'Cerrado ahora',
  },
}

const categoryIcons = {
  'basic-needs': Utensils,
  children: Baby,
  families: Users,
  health: HeartPulse,
  'older-adults': HandHeart,
  jobs: BriefcaseBusiness,
  housing: House,
  transportation: Bus,
  community: TreePine,
  education: GraduationCap,
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage can be unavailable */ }
  }, [key, value])
  return [value, setValue]
}

function App() {
  const [saved, setSaved] = useStoredState('waxhaw-saved', [])
  const [language, setLanguage] = useStoredState('waxhaw-language', 'en')
  const [preferences, setPreferences] = useStoredState('waxhaw-accessibility', {
    text: 'normal', contrast: false, reducedMotion: false,
  })
  const [compare, setCompare] = useState([])
  const [toast, setToast] = useState('')
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dataset.text = preferences.text
    document.documentElement.dataset.contrast = preferences.contrast ? 'high' : 'normal'
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
  }, [language, preferences])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const toggleSaved = (id) => {
    const exists = saved.includes(id)
    setSaved(exists ? saved.filter((item) => item !== id) : [...saved, id])
    setToast(exists ? 'Resource removed from your plan.' : 'Resource saved to your plan.')
  }

  const toggleCompare = (id) => {
    if (compare.includes(id)) return setCompare(compare.filter((item) => item !== id))
    if (compare.length >= 3) return setToast('Compare up to three resources at a time.')
    setCompare([...compare, id])
  }

  const value = { saved, toggleSaved, compare, toggleCompare, language, setLanguage, preferences, setPreferences, setToast, t: copy[language] }

  return (
    <AppContext.Provider value={value}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!online && <div className="offline-banner" role="status"><Zap size={17} /> You’re offline. Saved information and previously visited pages remain available.</div>}
      <Header />
      <ScrollToTop />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/urgent" element={<UrgentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <CompareTray />
      <Footer />
      <div className={`toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
    </AppContext.Provider>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const routeTitles = {
      '/': 'Waxhaw Connect | Community resources for every stage of life',
      '/resources': 'Resource directory | Waxhaw Connect',
      '/finder': 'Guided resource finder | Waxhaw Connect',
      '/events': 'Community events | Waxhaw Connect',
      '/saved': 'Your saved plan | Waxhaw Connect',
      '/about': 'Sources and methodology | Waxhaw Connect',
      '/urgent': 'Urgent support | Waxhaw Connect',
    }
    const detailResource = pathname.startsWith('/resources/') ? resources.find((item) => `/resources/${item.id}` === pathname) : null
    document.title = detailResource ? `${detailResource.name} | Waxhaw Connect` : (routeTitles[pathname] || 'Page not found | Waxhaw Connect')
  }, [pathname])
  return null
}

function BrandMark({ compact = false }) {
  return (
    <Link className={`brand ${compact ? 'brand--compact' : ''}`} to="/" aria-label="Waxhaw Connect home">
      <span className="brand__mark" aria-hidden="true"><Leaf /><span /></span>
      <span><strong>Waxhaw Connect</strong><small>People · Resources · A stronger tomorrow</small></span>
    </Link>
  )
}

function Header() {
  const { saved, language, setLanguage, preferences, setPreferences, t } = useContext(AppContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setMenuOpen(false); setAccessOpen(false) }, [location.pathname])

  const navItems = [
    ['/resources', t.resources], ['/events', t.events], ['/finder', t.finder], ['/about', t.about],
  ]
  return (
    <>
      <div className="utility-bar">
        <span><MapPin size={15} /> {t.location}</span>
        <span className="utility-tagline">{t.tagline}</span>
        <div className="utility-actions">
          <button className="utility-button" onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} aria-label={language === 'en' ? 'Cambiar a español' : 'Switch to English'}>
            <Languages size={16} /> {language === 'en' ? 'Español' : 'English'}
          </button>
          <button className="utility-button" onClick={() => setAccessOpen(!accessOpen)} aria-expanded={accessOpen} aria-controls="accessibility-panel">
            <Accessibility size={17} /> Accessibility
          </button>
        </div>
      </div>
      <header className="site-header">
        <BrandMark />
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="main-navigation" aria-label="Toggle navigation">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav id="main-navigation" className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Main navigation">
          {navItems.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          <NavLink className="saved-nav" to="/saved"><Bookmark size={18} /> {t.saved} <span>{saved.length}</span></NavLink>
          <Link className="button button--primary nav-search" to="/resources"><Search size={18} /> {t.search}</Link>
        </nav>
      </header>
      {accessOpen && (
        <section id="accessibility-panel" className="access-panel" aria-label="Accessibility settings">
          <div>
            <strong>Make this site easier to use</strong>
            <span>Your preferences stay on this device.</span>
          </div>
          <fieldset>
            <legend>Text size</legend>
            <div className="segmented">
              {['normal', 'large', 'largest'].map((size, index) => (
                <button key={size} className={preferences.text === size ? 'is-active' : ''} onClick={() => setPreferences({ ...preferences, text: size })} aria-pressed={preferences.text === size}>
                  A{index ? '+' : ''}{index === 2 ? '+' : ''}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="switch-row"><input type="checkbox" checked={preferences.contrast} onChange={(e) => setPreferences({ ...preferences, contrast: e.target.checked })} /> High contrast</label>
          <label className="switch-row"><input type="checkbox" checked={preferences.reducedMotion} onChange={(e) => setPreferences({ ...preferences, reducedMotion: e.target.checked })} /> Reduce motion</label>
          <button className="icon-button" onClick={() => setAccessOpen(false)} aria-label="Close accessibility settings"><X /></button>
        </section>
      )}
    </>
  )
}

function Townscape() {
  return (
    <svg className="townscape" viewBox="0 0 1440 330" role="img" aria-label="An illustrated Waxhaw townscape with trees, paths, neighbors, a water tower and downtown buildings">
      <defs>
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" opacity=".12" /></pattern>
      </defs>
      <path className="sky-wash" d="M0 40C230 85 315 5 500 50s340 30 510 0 282-4 430 36v244H0z" />
      <path className="land" d="M0 260c180-40 330 20 500-10 190-35 320-10 475 18 170 31 310-12 465-38v100H0z" />
      <path className="path" d="M560 330c105-66 150-109 244-124 82-13 145 5 232 39" />
      <g className="trees">
        {[70, 145, 1210, 1300, 1370].map((x, i) => <g key={x} transform={`translate(${x} ${220 - (i % 2) * 18})`}><path d="M0 80V25" /><circle cy="12" r="34" /><circle cx="-24" cy="30" r="25" /><circle cx="24" cy="32" r="28" /></g>)}
      </g>
      <g className="water-tower" transform="translate(1088 105)"><ellipse cx="42" cy="18" rx="38" ry="13" /><path d="M5 20h74l-9 62H15z" /><path d="M22 82 8 163M61 82l15 81M17 115h49M12 145h60" /><text x="42" y="56" textAnchor="middle">WAXHAW</text></g>
      <g className="buildings" transform="translate(1175 184)"><path d="M0 34h76v108H0zM78 0h92v142H78zM172 25h70v117h-70z" /><path d="M12 56h15v25H12zm28 0h15v25H40zm56-28h18v30H96zm32 0h18v30h-18zm62 20h14v24h-14zm25 0h14v24h-14z" /></g>
      <g className="people" transform="translate(220 246)"><circle cx="0" cy="0" r="8" /><path d="M0 8v32m0-18-15 12m15-12 16 9m-16 9-12 26m12-26 14 26" /><circle cx="80" cy="8" r="7" /><path d="M80 15v28m0-17-11 10m11-10 12 7m-12 10-9 22m9-22 11 22" /></g>
      <rect className="texture" width="1440" height="330" fill="url(#dots)" />
    </svg>
  )
}

function HeroSearch() {
  const { t } = useContext(AppContext)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const submit = (event) => {
    event.preventDefault()
    navigate(`/resources${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }
  return (
    <form className="hero-search" onSubmit={submit} role="search">
      <label htmlFor="home-search">{t.searchLabel}</label>
      <div><Search aria-hidden="true" /><input id="home-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} /><button type="submit">{t.search}<ArrowRight size={18} /></button></div>
    </form>
  )
}

function HomePage() {
  const { t, language } = useContext(AppContext)
  return (
    <>
      <section className="hero">
        <Townscape />
        <div className="hero__content">
          <span className="eyebrow"><MapPin size={15} /> Waxhaw, North Carolina</span>
          <h1>{language === 'es' ? <>Encuentre apoyo. Participe.<br />Siéntase en casa.</> : <>Find support. Join in.<br />Feel at home.</>}</h1>
          <p>{t.heroSub}</p>
          <HeroSearch />
          <div className="popular-searches"><strong>{language === 'en' ? 'Popular searches:' : 'Búsquedas populares:'}</strong>{['Food assistance', 'Housing help', 'Mental health', 'After-school programs', 'Senior services'].map((item) => <Link key={item} to={`/resources?q=${encodeURIComponent(item)}`}>{item}</Link>)}</div>
        </div>
      </section>
      <UrgentBand />
      <section className="section category-section">
        <div className="section-heading"><div><span className="eyebrow">For every stage of life</span><h2>{t.explore}</h2><p>{t.exploreSub}</p></div><Link to="/resources">{t.viewAll}<ArrowRight size={17} /></Link></div>
        <div className="category-rail">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id]
            return <Link key={category.id} to={`/resources?category=${category.id}`}><span><Icon /></span><strong>{language === 'es' ? category.labelEs : category.label}</strong><small>{category.blurb}</small></Link>
          })}
        </div>
      </section>
      <section className="section home-grid">
        <div className="guide-feature">
          <div className="guide-copy"><span className="feature-icon"><Compass /></span><h2>{t.guide}</h2><p>{t.guideSub}</p><Link className="button button--primary" to="/finder">Start the guided finder <ArrowRight size={18} /></Link></div>
          <WayfindingSign />
        </div>
        <FeaturedResource />
        <div className="home-grid__side">
          <SavedPreview />
          <EventsPreview />
        </div>
      </section>
      <section className="trust-strip"><ShieldCheck /><div><strong>Built on verified local information</strong><span>Sources are clearly labeled, and every listing shows when it was checked.</span></div><Link to="/about#sources">See our sources <ArrowRight size={17} /></Link></section>
    </>
  )
}

function UrgentBand() {
  const { t } = useContext(AppContext)
  return (
    <section className="urgent-band" aria-labelledby="urgent-title">
      <div className="urgent-band__intro"><span><CircleAlert /></span><div><h2 id="urgent-title">{t.urgent}</h2><p>{t.urgentSub}</p></div></div>
      <div className="urgent-band__links">
        {urgentLinks.slice(0, 3).map((item) => <a key={item.label} href={`tel:${item.phone}`}><Phone size={20} /><span><strong>{item.label}</strong><small>{item.detail}</small></span></a>)}
      </div>
      <Link className="button button--outline-danger" to="/urgent">View all urgent help <ArrowRight size={17} /></Link>
    </section>
  )
}

function WayfindingSign() {
  return (
    <div className="wayfinding" aria-hidden="true">
      <div className="wayfinding__foliage"><Leaf /><Leaf /><Leaf /></div>
      <span>ANSWERS <ArrowRight /></span><span>SUPPORT <ArrowRight /></span><span>OPPORTUNITIES <ArrowRight /></span><span>A STRONGER<br />TOMORROW <ArrowRight /></span><i />
    </div>
  )
}

function FeaturedResource() {
  const { t, language } = useContext(AppContext)
  const resource = resources.find((item) => item.id === 'common-heart')
  return (
    <article className="featured-resource">
      <div className="feature-kicker"><span><Sparkles size={17} /> Featured resource</span><SourceBadge /></div>
      <h2>{resource.name}</h2>
      <p>{language === 'es' ? resource.descriptionEs : resource.description}</p>
      <div className="resource-meta"><span><MapPin /> {resource.location}</span><span><Clock3 /> {resource.hours}</span></div>
      <div className="featured-resource__footer"><Link className="button button--primary" to={`/resources/${resource.id}`}>{t.viewDetails} <ArrowRight size={17} /></Link><span><Info size={16} /> {t.checked} {resource.verified}</span></div>
    </article>
  )
}

function SavedPreview() {
  const { saved } = useContext(AppContext)
  const savedMessage = saved.length === 1
    ? '1 resource is ready when you need it.'
    : saved.length > 1
      ? `${saved.length} resources are ready when you need them.`
      : 'Save resources and build a practical next-step list.'
  return (
    <div className="saved-preview"><Bookmark /><div><h2>Your saved plan</h2><p>{savedMessage}</p><Link to="/saved">View your saved items <ArrowRight size={16} /></Link></div></div>
  )
}

function EventsPreview() {
  const { t } = useContext(AppContext)
  return (
    <div className="events-preview"><div className="mini-heading"><h2><CalendarDays /> {t.upcoming}</h2><Link to="/events">View all</Link></div>{[...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map((event) => <EventRow key={event.id} event={event} />)}</div>
  )
}

function EventRow({ event }) {
  const date = new Date(`${event.date}T12:00:00`)
  return <div className="event-row"><time dateTime={event.date}><strong>{date.toLocaleDateString('en-US', { month: 'short' })}</strong><span>{date.getDate()}</span></time><div><strong>{event.title}</strong><small>{event.time} · {event.location}</small></div></div>
}

function isOpen(resource) {
  if (resource.alwaysOpen) return true
  if (!resource.schedule) return null
  const now = new Date()
  return resource.schedule.days.includes(now.getDay()) && now.getHours() >= resource.schedule.start && now.getHours() < resource.schedule.end
}

function SourceBadge() {
  const { t } = useContext(AppContext)
  return <span className="source-badge"><BadgeCheck /> {t.verified}</span>
}

function ResourceCard({ resource, compact = false }) {
  const { saved, toggleSaved, compare, toggleCompare, language, t } = useContext(AppContext)
  const open = isOpen(resource)
  const Icon = categoryIcons[resource.category] || Building2
  return (
    <article className={`resource-card ${compact ? 'resource-card--compact' : ''}`}>
      <div className="resource-card__top"><span className={`category-symbol category-symbol--${resource.category}`}><Icon /></span><div className="resource-card__badges"><SourceBadge />{open !== null && <span className={open ? 'open-badge' : 'closed-badge'}>{open ? t.openNow : t.closedNow}</span>}</div></div>
      <div><span className="resource-card__category">{categories.find((item) => item.id === resource.category)?.label}</span><h2><Link to={`/resources/${resource.id}`}>{resource.name}</Link></h2><p>{language === 'es' ? resource.descriptionEs : resource.description}</p></div>
      <div className="resource-meta"><span><MapPin /> {resource.location}</span><span><Clock3 /> {resource.hours}</span><span><Info /> {resource.cost}</span></div>
      <div className="tag-list">{resource.audiences.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="resource-card__actions">
        <Link className="text-link" to={`/resources/${resource.id}`}>{t.viewDetails}<ArrowRight size={16} /></Link>
        <button className={saved.includes(resource.id) ? 'save-button is-saved' : 'save-button'} onClick={() => toggleSaved(resource.id)} aria-pressed={saved.includes(resource.id)}><Bookmark /> {saved.includes(resource.id) ? t.savedVerb : t.save}</button>
        {!compact && <label className="compare-check"><input type="checkbox" checked={compare.includes(resource.id)} onChange={() => toggleCompare(resource.id)} /> Compare</label>}
      </div>
    </article>
  )
}

function ResourcesPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || 'all')
  const [audience, setAudience] = useState('all')
  const [cost, setCost] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { language } = useContext(AppContext)

  useEffect(() => { setQuery(params.get('q') || ''); setCategory(params.get('category') || 'all') }, [params])

  const results = useMemo(() => resources.filter((resource) => {
    const haystack = [resource.name, resource.description, resource.descriptionEs, resource.category, ...resource.keywords, ...resource.audiences].join(' ').toLowerCase()
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    const matchesQuery = !words.length || words.every((word) => haystack.includes(word) || ({ housing: 'shelter', groceries: 'food', doctor: 'health', bus: 'transportation', senior: 'older adults', kid: 'children' }[word] && haystack.includes({ housing: 'shelter', groceries: 'food', doctor: 'health', bus: 'transportation', senior: 'older adults', kid: 'children' }[word])))
    const matchesCategory = category === 'all' || resource.category === category
    const matchesAudience = audience === 'all' || resource.audiences.join(' ').toLowerCase().includes(audience)
    const matchesCost = cost === 'all' || (cost === 'free' ? resource.cost.toLowerCase().includes('free') : !resource.cost.toLowerCase().includes('free'))
    return matchesQuery && matchesCategory && matchesAudience && matchesCost
  }), [query, category, audience, cost])

  const submitSearch = (e) => { e.preventDefault(); const next = new URLSearchParams(); if (query) next.set('q', query); if (category !== 'all') next.set('category', category); setParams(next) }
  const clear = () => { setQuery(''); setCategory('all'); setAudience('all'); setCost('all'); setParams({}) }

  return (
    <>
      <PageHero eyebrow="Resource directory" title="Find the right support" intro="Search trusted organizations, programs and services serving Waxhaw and Union County." compact>
        <form className="directory-search" onSubmit={submitSearch} role="search"><label htmlFor="directory-query">What do you need?</label><div><Search /><input id="directory-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try food, rides, child care or benefits" /><button className="button button--primary">Search</button></div></form>
      </PageHero>
      <section className="directory-layout section">
      <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><Filter /> Filters <ChevronDown /></button>
      <aside className={`filters ${filtersOpen ? 'filters--open' : ''}`} aria-label="Resource filters">
        <div className="filter-heading"><h2>Filter resources</h2><button onClick={clear}>Clear all</button></div>
        <label>Topic<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All topics</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === 'es' ? item.labelEs : item.label}</option>)}</select></label>
        <label>Who is this for?<select value={audience} onChange={(e) => setAudience(e.target.value)}><option value="all">Everyone</option><option value="children">Children</option><option value="families">Families</option><option value="adults">Adults</option><option value="older">Older adults</option><option value="veterans">Veterans</option></select></label>
        <label>Cost<select value={cost} onChange={(e) => setCost(e.target.value)}><option value="all">Any cost</option><option value="free">Free or free to apply</option><option value="varies">Varies</option></select></label>
        <div className="filter-help"><Compass /><strong>Not sure which filters to use?</strong><p>Our guided finder asks plain-language questions.</p><Link to="/finder">Help me choose <ArrowRight /></Link></div>
      </aside>
      <div className="results">
        <div className="results__heading"><div><span aria-live="polite">{results.length} resource{results.length === 1 ? '' : 's'} found</span>{query && <strong> for “{query}”</strong>}</div><span>Checked September 11, 2026</span></div>
        {results.length ? <div className="resource-list">{results.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <div className="empty-state"><Search /><h2>We couldn’t find an exact match</h2><p>Try a broader word, remove a filter, or use the guided finder. You can also call NC 211 for personal help.</p><div><button className="button button--primary" onClick={clear}>Clear search and filters</button><Link className="button button--secondary" to="/finder">Use guided finder</Link></div></div>}
      </div>
      </section>
    </>
  )
}

function ResourceDetailPage() {
  const { resourceId } = useParams()
  const resource = resources.find((item) => item.id === resourceId)
  const { saved, toggleSaved, language, t } = useContext(AppContext)
  if (!resource) return <NotFoundPage />
  const Icon = categoryIcons[resource.category] || Building2
  const related = resources.filter((item) => item.category === resource.category && item.id !== resource.id).slice(0, 3)
  const open = isOpen(resource)
  return (
    <>
      <section className="detail-hero">
        <div className="section"><Link className="back-link" to="/resources"><ArrowLeft /> Back to all resources</Link><div className="detail-hero__grid"><div><div className="detail-kickers"><span className="category-symbol"><Icon /></span><SourceBadge />{open !== null && <span className={open ? 'open-badge' : 'closed-badge'}>{open ? t.openNow : t.closedNow}</span>}</div><h1>{resource.name}</h1><p>{language === 'es' ? resource.descriptionEs : resource.description}</p><div className="detail-actions"><a className="button button--primary" href={`tel:${resource.phone.replace(/[^\d]/g, '')}`}><Phone /> Call {resource.phone}</a><a className="button button--secondary" href={resource.sourceUrl} target="_blank" rel="noreferrer">Visit provider site <ExternalLink /></a><button className={saved.includes(resource.id) ? 'button button--saved' : 'button button--secondary'} onClick={() => toggleSaved(resource.id)}><Bookmark /> {saved.includes(resource.id) ? 'Saved to plan' : 'Save to plan'}</button></div></div><aside className="verification-card"><BadgeCheck /><strong>Information you can verify</strong><span>Source: {resource.source}</span><span>Checked: {resource.verified}</span><a href={resource.sourceUrl} target="_blank" rel="noreferrer">View original source <ExternalLink /></a></aside></div></div>
      </section>
      <section className="section detail-layout"><article><h2>How this resource can help</h2><p>{resource.details}</p><div className="detail-facts"><div><Clock3 /><span><strong>Hours</strong>{resource.hours}</span></div><div><MapPin /><span><strong>Location</strong>{resource.location}</span></div><div><Info /><span><strong>Cost</strong>{resource.cost}</span></div><div><Globe2 /><span><strong>Languages</strong>{resource.languages.join(', ')}</span></div></div><h2>Before you contact them</h2><ul className="check-list"><li><Check /> Call or check the provider website to confirm current eligibility, hours and documents needed.</li><li><Check /> Ask about language or disability accommodations when scheduling.</li><li><Check /> If this resource is not a match, call NC 211 for a personalized referral.</li></ul></article><aside className="next-step"><span className="eyebrow">Your next step</span><h2>Keep the details handy</h2><p>Print this page or save the resource to your personal action plan.</p><button className="button button--secondary" onClick={() => window.print()}><Printer /> Print this resource</button><Link to="/saved">Open saved plan <ArrowRight /></Link></aside></section>
      {!!related.length && <section className="section related"><div className="section-heading"><div><span className="eyebrow">More options</span><h2>Related resources</h2></div></div><div className="related-grid">{related.map((item) => <ResourceCard key={item.id} resource={item} compact />)}</div></section>}
    </>
  )
}

function FinderPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ need: '', who: '', priority: '' })
  const navigate = useNavigate()
  const questions = [
    { key: 'need', title: 'What would make the biggest difference today?', hint: 'Choose the closest match. You can explore other needs afterward.', options: categories.slice(0, 8).map((item) => ({ value: item.id, label: item.label, icon: categoryIcons[item.id] })) },
    { key: 'who', title: 'Who are you finding support for?', hint: 'This helps us surface eligibility information.', options: [{ value: 'all', label: 'Myself or anyone', icon: Users }, { value: 'children', label: 'A child or teen', icon: Baby }, { value: 'families', label: 'A family', icon: Home }, { value: 'older', label: 'An older adult', icon: HandHeart }, { value: 'veterans', label: 'A veteran or service member', icon: ShieldCheck }] },
    { key: 'priority', title: 'What matters most right now?', hint: 'We’ll prioritize resources using this preference.', options: [{ value: 'fast', label: 'Available as soon as possible', icon: Zap }, { value: 'free', label: 'Free or low-cost support', icon: HandHeart }, { value: 'local', label: 'Closest to Waxhaw', icon: MapPin }, { value: 'language', label: 'Language or access support', icon: Languages }] },
  ]
  const question = questions[step]
  const results = useMemo(() => {
    if (step < questions.length) return []
    return resources.filter((item) => item.category === answers.need).sort((a, b) => {
      if (answers.priority === 'free') return Number(b.cost.toLowerCase().includes('free')) - Number(a.cost.toLowerCase().includes('free'))
      if (answers.priority === 'fast') return Number(Boolean(b.alwaysOpen || b.schedule)) - Number(Boolean(a.alwaysOpen || a.schedule))
      if (answers.priority === 'local') return Number(b.location.toLowerCase().includes('waxhaw')) - Number(a.location.toLowerCase().includes('waxhaw'))
      return b.languages.length - a.languages.length
    }).slice(0, 4)
  }, [step, answers])
  const choose = (value) => { setAnswers({ ...answers, [question.key]: value }); window.setTimeout(() => setStep(step + 1), 150) }
  const reset = () => { setStep(0); setAnswers({ need: '', who: '', priority: '' }) }
  return (
    <>
      <PageHero eyebrow="Guided resource finder" title={step < questions.length ? 'A few questions. A clearer next step.' : 'Here are some places to start.'} intro={step < questions.length ? 'No forms, no account, and no personal information is stored.' : 'These suggestions are based on your choices. Always confirm eligibility with the provider.'} compact />
      <section className="section finder-shell">
        {step < questions.length ? <div className="finder-panel"><div className="finder-progress"><span>Question {step + 1} of {questions.length}</span><div role="progressbar" aria-valuemin="1" aria-valuemax={questions.length} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div></div><h2>{question.title}</h2><p>{question.hint}</p><div className="finder-options">{question.options.map((option) => { const Icon = option.icon; return <button key={option.value} onClick={() => choose(option.value)}><Icon /><span>{option.label}</span><ArrowRight /></button> })}</div>{step > 0 && <button className="back-link" onClick={() => setStep(step - 1)}><ArrowLeft /> Previous question</button>}</div> : <div className="finder-results"><div className="finder-summary"><BadgeCheck /><div><strong>Your suggested starting points</strong><span>Need: {categories.find((item) => item.id === answers.need)?.label} · Priority: {answers.priority}</span></div><button onClick={reset}>Start over</button></div>{results.length ? <div className="related-grid">{results.map((item) => <ResourceCard key={item.id} resource={item} compact />)}</div> : <div className="empty-state"><Compass /><h2>Let’s broaden the search</h2><p>We do not have an exact listing in this category yet. NC 211 can connect you with a verified specialist.</p><Link className="button button--primary" to="/resources">Browse all resources</Link></div>}<div className="finder-actions"><button className="button button--secondary" onClick={() => window.print()}><Printer /> Print suggestions</button><button className="button button--primary" onClick={() => navigate(`/resources?category=${answers.need}`)}>See every matching resource <ArrowRight /></button></div></div>}
        <aside className="privacy-note"><ShieldCheck /><div><strong>Private by design</strong><p>Your answers stay in this browser and are not sent anywhere.</p></div></aside>
      </section>
    </>
  )
}

function EventsPage() {
  const [filter, setFilter] = useState('All')
  const filtered = [...(filter === 'All' ? events : events.filter((event) => event.category === filter))].sort((a, b) => a.date.localeCompare(b.date))
  const downloadCalendar = (eventItem) => {
    const date = eventItem.date.replaceAll('-', '')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:${date}\nSUMMARY:${eventItem.title}\nLOCATION:${eventItem.location}\nDESCRIPTION:${eventItem.description}\nEND:VEVENT\nEND:VCALENDAR`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    link.download = `${eventItem.id}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <>
      <PageHero eyebrow="Community calendar" title="Show up for what matters" intro="Officially listed events, programs and public meetings that bring Waxhaw neighbors together." compact />
      <section className="section events-page"><div className="filter-pills" aria-label="Filter events">{['All', ...new Set(events.map((event) => event.category))].map((item) => <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div><div className="event-list">{filtered.map((event) => { const date = new Date(`${event.date}T12:00:00`); return <article key={event.id} className="event-card"><time dateTime={event.date}><strong>{date.toLocaleDateString('en-US', { month: 'short' })}</strong><span>{date.getDate()}</span><small>{date.toLocaleDateString('en-US', { weekday: 'short' })}</small></time><div><span className="event-category">{event.category}</span><h2>{event.title}</h2><p>{event.description}</p><div className="event-facts"><span><Clock3 /> {event.time}</span><span><MapPin /> {event.location}</span><span><Accessibility /> {event.accessibility}</span></div></div><div className="event-actions"><button className="button button--secondary" onClick={() => downloadCalendar(event)}><CalendarDays /> Add to calendar</button><a className="text-link" href={event.sourceUrl} target="_blank" rel="noreferrer">Official event details <ExternalLink /></a></div></article> })}</div><p className="freshness-note"><Info /> Event details can change. Each event links to its official source so you can confirm before leaving home.</p></section>
    </>
  )
}

function SavedPage() {
  const { saved, toggleSaved } = useContext(AppContext)
  const savedResources = resources.filter((resource) => saved.includes(resource.id))
  return (
    <>
      <PageHero eyebrow="Your saved plan" title="Keep your next steps together" intro="Saved resources stay on this device. Print the plan or return whenever you are ready." compact />
      <section className="section saved-page">
        {savedResources.length ? <><div className="plan-toolbar"><span><Bookmark /> {savedResources.length} saved resource{savedResources.length === 1 ? '' : 's'}</span><button className="button button--secondary" onClick={() => window.print()}><Printer /> Print action plan</button></div><ol className="action-plan">{savedResources.map((resource, index) => <li key={resource.id}><span className="action-plan__number">{String(index + 1).padStart(2, '0')}</span><div><h2><Link to={`/resources/${resource.id}`}>{resource.name}</Link></h2><p>{resource.description}</p><div className="resource-meta"><span><Phone /> {resource.phone}</span><span><Clock3 /> {resource.hours}</span></div></div><div className="action-plan__actions"><a className="button button--primary" href={`tel:${resource.phone.replace(/[^\d]/g, '')}`}>Call</a><button className="text-button" onClick={() => toggleSaved(resource.id)}>Remove</button></div></li>)}</ol></> : <div className="empty-state empty-state--large"><Bookmark /><h2>Your plan is ready when you are</h2><p>Save useful resources as you browse. They will appear here as a clear, printable next-step list.</p><div><Link className="button button--primary" to="/resources">Explore resources</Link><Link className="button button--secondary" to="/finder">Use guided finder</Link></div></div>}
      </section>
    </>
  )
}

function UrgentPage() {
  return (
    <>
      <PageHero eyebrow="Urgent support" title="You do not have to handle this alone" intro="Use the options below for immediate assistance. If someone is in immediate danger or needs emergency medical help, call 911." compact danger />
      <section className="section urgent-page"><div className="urgent-list">{urgentLinks.map((item) => <a key={item.label} href={`tel:${item.phone}`}><span><Phone /></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ArrowRight /></a>)}</div><article className="safety-note"><ShieldCheck /><div><h2>Safety and privacy</h2><p>If you are viewing this page in an unsafe situation, use a device the other person cannot access when possible. Browser history may record your visit. Turning Point keeps its shelter location confidential.</p><a href="https://turningpointnc.org/" target="_blank" rel="noreferrer">Visit Turning Point <ExternalLink /></a></div></article><div className="urgent-disclaimer"><Info /><p><strong>This directory is not an emergency service.</strong> Information is provided to help residents find official support. Availability and eligibility can change, so confirm details with the provider.</p></div></section>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Waxhaw Connect" title="Trust should be visible" intro="A community directory is only useful when people can understand where information came from, when it was checked and what to do next." compact />
      <section className="section about-layout"><article><h2>What this website is for</h2><p>Waxhaw Connect brings organizations, programs, services, events and community resources into one inclusive experience. It supports residents across ages, abilities, backgrounds and levels of digital confidence.</p><h2>How information is selected</h2><ol className="method-list"><li><span>01</span><div><strong>Start with authoritative sources</strong><p>Official government, school, nonprofit and service-provider pages are preferred.</p></div></li><li><span>02</span><div><strong>Write for real decisions</strong><p>Each listing explains what the resource does, who it may serve, cost, contact details and what to confirm.</p></div></li><li><span>03</span><div><strong>Show provenance</strong><p>Every detail page links to its original source and displays the most recent review date.</p></div></li><li><span>04</span><div><strong>Design for change</strong><p>Residents are reminded to verify details because hours, eligibility and availability can change.</p></div></li></ol><h2 id="sources">Professionally legitimate sources</h2><div className="source-list">{sourceNotes.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer"><span><strong>{source.name}</strong><small>{source.role}</small></span><ExternalLink /></a>)}</div></article><aside className="about-aside"><span className="feature-icon"><Accessibility /></span><h2>Inclusive by default</h2><p>The interface targets WCAG 2.2 Level AA with semantic landmarks, keyboard navigation, visible focus, contrast-safe colors, reduced motion, scalable text and plain language.</p><h3>Success measures</h3><ul><li>Resource-finding completion rate</li><li>Search success and no-results rate</li><li>Time to locate suitable help</li><li>Guided-finder completion</li><li>Mobile and accessibility task success</li></ul><span className="review-stamp"><BadgeCheck /> Directory reviewed September 11, 2026</span></aside></section>
    </>
  )
}

function CompareTray() {
  const { compare, toggleCompare } = useContext(AppContext)
  const [expanded, setExpanded] = useState(false)
  if (!compare.length) return null
  const items = resources.filter((resource) => compare.includes(resource.id))
  return (
    <aside className={`compare-tray ${expanded ? 'compare-tray--expanded' : ''}`} aria-label="Compare resources">
      <div className="compare-tray__bar"><button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><span><Filter /> Compare resources</span><strong>{items.length} of 3 selected</strong><ChevronDown /></button></div>
      {expanded && <div className="compare-table"><div className="compare-table__intro"><h2>Compare your options</h2><p>Review practical details side by side.</p></div>{items.map((item) => <article key={item.id}><button className="icon-button" onClick={() => toggleCompare(item.id)} aria-label={`Remove ${item.name} from comparison`}><X /></button><h3>{item.name}</h3><dl><dt>Cost</dt><dd>{item.cost}</dd><dt>Hours</dt><dd>{item.hours}</dd><dt>Who it serves</dt><dd>{item.audiences.join(', ')}</dd><dt>Location</dt><dd>{item.location}</dd></dl><Link className="text-link" to={`/resources/${item.id}`}>View details <ArrowRight /></Link></article>)}</div>}
    </aside>
  )
}

function PageHero({ eyebrow, title, intro, children, compact = false, danger = false }) {
  return <section className={`page-hero ${compact ? 'page-hero--compact' : ''} ${danger ? 'page-hero--danger' : ''}`}><div className="section"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p>{children}</div></section>
}

function NotFoundPage() {
  return <section className="section not-found"><Compass /><span className="eyebrow">404</span><h1>This path doesn’t lead to a resource</h1><p>The page may have moved. Start from the directory or let the guided finder point you in the right direction.</p><div><Link className="button button--primary" to="/resources">Browse resources</Link><Link className="button button--secondary" to="/finder">Use guided finder</Link></div></section>
}

function Footer() {
  return (
    <footer><div className="footer-main"><BrandMark compact /><p>One welcoming place for Waxhaw resources, events and opportunities.</p><div className="footer-links"><div><strong>Find support</strong><Link to="/resources">Resource directory</Link><Link to="/finder">Guided finder</Link><Link to="/urgent">Urgent help</Link></div><div><strong>Community</strong><Link to="/events">Events</Link><Link to="/saved">Saved plan</Link><Link to="/about">Sources and method</Link></div><div><strong>Always available</strong><a href="tel:211">Call NC 211</a><a href="tel:988">Call or text 988</a><a href="tel:911">Emergency: 911</a></div></div></div><div className="footer-bottom"><span>Waxhaw Connect is an independent student-designed community resource project.</span><span><Leaf /> Rooted in community. Focused on what’s next.</span></div></footer>
  )
}

export default App
