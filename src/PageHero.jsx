export default function PageHero({ eyebrow, title, intro, children, compact = false, danger = false }) {
  return <section className={`page-hero ${compact ? 'page-hero--compact' : ''} ${danger ? 'page-hero--danger' : ''}`}><div className="section"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p>{children}</div></section>
}
