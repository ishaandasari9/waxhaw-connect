import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Accessibility, ArrowLeft, ArrowRight, Baby, BadgeCheck, Bookmark, BriefcaseBusiness, Building2, Bus, CalendarDays, Check, ChevronDown, CircleAlert, Clock3, Compass, ExternalLink, Eye, EyeOff, FileDown, Filter, Flag, Globe2, GraduationCap, HandHeart, HeartPulse, Home, House, Info, Languages, Leaf, LockKeyhole, LogIn, LogOut, Mail, MapPin, Menu, Minus, Moon, Phone, Plus, Printer, Search, Send, Settings2, ShieldCheck, Sparkles, Sun, Trash2, TreePine, UserRound, Users, Utensils, X, Zap,
} from 'lucide-react'
import { categories, events, resources, sourceNotes, urgentLinks } from './data'
import { canReport, isHidden, reportBlockedReason, visibleEvents } from './moderation'
import { applyExtractedFields, buildIcs, eventInterests, expandEvents, getRecommendationReason, rankEventsForUser, todayISO, upcomingEvents } from './eventUtils'
import { extractEventFields } from './assist.js'
import { SITE_HOME_TITLE, SITE_NAME, SITE_TAGLINE, pageTitle } from './siteConfig'
import {
  createAccount, isBackendConfigured, loadProfile, publishCommunityEvent, removeCommunityEvent, reportCommunityEvent, saveProfile, signInWithEmail, signOutCurrentUser, subscribeToAuth, subscribeToCommunityEvents,
} from './backend'
import AssistLauncher from './AssistLauncher.jsx'
import EventPlannerPage, { PLAN_DRAFT_KEY } from './EventPlanner.jsx'
import PageHero from './PageHero.jsx'
import MetricsPanel from './Metrics.jsx'
import { DirectionsLink, DistanceOptions, DistanceTag, LocationPicker } from './DistanceControls.jsx'
import { DistanceContext, useDistanceState } from './distanceContext.js'
import { arrangeByDistance, describeDistance, placeFor } from './distance.js'

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
    darkMode: 'Dark mode', lightMode: 'Light mode', switchDark: 'Switch to dark mode', switchLight: 'Switch to light mode', theme: 'Appearance', themeSystem: 'Device', themeLight: 'Light', themeDark: 'Dark',
    assist: { needHelp: 'Need help?', communityHelper: 'Community helper', closeHelper: 'Close helper', planningTitle: 'Planning a community event?', planningIntro: 'See what made similar events work in other towns, then get a step-by-step plan for Waxhaw.', openPlanner: 'Open the event planner', panel: { heading: 'Describe your situation', intro: 'If you are not sure what to search for, say what is going on in your own words and we will point you to listings that may fit.', label: 'What is happening?', placeholder: 'For example: my mother stopped driving and cannot get to her appointments', looking: 'Looking', find: 'Find listings', hint: "Suggestions come from this site's verified directory. Every detail shown below is from the listing itself.", loading: 'Looking through the directory.', oneResult: '1 suggested listing below.', manyResults: '{count} suggested listings below.', noMatch: 'No close match found.', urgentStatus: 'Urgent help options shown below.', urgentTitle: 'If someone is in danger, get help now', urgentIntro: 'Call 911 for an emergency. Call or text 988 for the Suicide and Crisis Lifeline.', urgentLink: 'See urgent help', fallback: 'Showing keyword matches. The guided finder may work better for this.', emptyTitle: 'We could not find a close match', emptyIntro: 'Try the guided finder, or call NC 211 to speak with a specialist.', finderLink: 'Use guided finder' } },
    resourcesPage: { title: 'Find the right support', intro: 'Search trusted organizations, programs and services serving Waxhaw and Union County.', filters: 'Filters', filtersLabel: 'Resource filters', filterResources: 'Filter resources', clearAll: 'Clear all', topic: 'Topic', allTopics: 'All topics', audience: 'Who is this for?', everyone: 'Everyone', children: 'Children', families: 'Families', adults: 'Adults', olderAdults: 'Older adults', veterans: 'Veterans', cost: 'Cost', anyCost: 'Any cost', free: 'Free or free to apply', varies: 'Varies', filterHelp: 'Not sure which filters to use?', filterHelpIntro: 'Our guided finder asks plain-language questions.', helpChoose: 'Help me choose', checked: 'Checked' },
    footer: { intro: 'One welcoming place for Waxhaw resources, events and opportunities.', findSupport: 'Find support', resourceDirectory: 'Resource directory', guidedFinder: 'Guided finder', urgentHelp: 'Urgent help', community: 'Community', events: 'Events', savedPlan: 'Saved plan', sourcesMethod: 'Sources and method', alwaysAvailable: 'Always available', call211: 'Call NC 211', call988: 'Call or text 988', emergency: 'Emergency: 911', project: 'is an independent student-designed community resource project.', tagline: 'Rooted in community. Focused on what’s next.' },
    verificationReviewed: 'Directory reviewed',
    savedPreview: { title: 'Your saved plan', one: '1 resource is ready when you need it.', many: '{count} resources are ready when you need them.', empty: 'Save resources and build a practical next-step list.', view: 'View your saved items' },
    resourceDetail: { back: 'Back to all resources', call: 'Call', visit: 'Visit provider site', saved: 'Saved to plan', save: 'Save to plan', verify: 'Information you can verify', source: 'Source', checked: 'Checked', original: 'View original source', help: 'How this resource can help', hours: 'Hours', location: 'Location', cost: 'Cost', languages: 'Languages', before: 'Before you contact them', confirm: 'Call or check the provider website to confirm current eligibility, hours and documents needed.', accommodations: 'Ask about language or disability accommodations when scheduling.', referral: 'If this resource is not a match, call NC 211 for a personalized referral.', next: 'Your next step', handy: 'Keep the details handy', handyIntro: 'Print this page or save the resource to your personal action plan.', print: 'Print this resource', openPlan: 'Open saved plan', more: 'More options', related: 'Related resources' },
    finderPage: { eyebrow: 'Guided resource finder', title: 'A few questions. A clearer next step.', resultsTitle: 'Here are some places to start.', intro: 'No forms, no account, and no personal information is stored.', resultsIntro: 'These suggestions are based on your choices. Always confirm eligibility with the provider.', question: 'Question', of: 'of', progress: 'Guided finder progress', previous: 'Previous question', suggestions: 'Your suggested starting points', need: 'Need', priority: 'Priority', startOver: 'Start over', broaden: 'Let’s broaden the search', broadenIntro: 'We do not have an exact listing in this category yet. NC 211 can connect you with a verified specialist.', browse: 'Browse all resources', print: 'Print suggestions', every: 'See every matching resource', private: 'Private by design', privateIntro: 'Your answers stay in this browser and are not sent anywhere.', questions: [{ title: 'What would make the biggest difference today?', hint: 'Choose the closest match. You can explore other needs afterward.' }, { title: 'Who are you finding support for?', hint: 'This helps us surface eligibility information.' }, { title: 'What matters most right now?', hint: 'We’ll prioritize resources using this preference.' }], who: { all: 'Myself or anyone', children: 'A child or teen', families: 'A family', older: 'An older adult', veterans: 'A veteran or service member' }, priorities: { fast: 'Available as soon as possible', free: 'Free or low-cost support', local: 'Closest to Waxhaw', language: 'Language or access support' } },
    eventsPage: { eyebrow: 'Community calendar', title: 'Show up for what matters', intro: 'Official listings and neighbor-posted events that bring Waxhaw together.', post: 'Post an event', plan: 'Plan an event', signIn: 'Sign in for recommendations', yourCalendar: 'Your calendar', picked: 'Picked for {name}', paused: 'Personalization is paused', matching: 'Matching your interests in {interests}.', chooseInterests: 'Choose a few interests to start getting personal recommendations.', chronological: 'Your calendar is in chronological order until you turn recommendations back on.', edit: 'Edit interests', makeYours: 'Make it yours', discover: 'Find more events you’ll love', discoverIntro: 'Choose your interests and we’ll bring the best matches to the top.', create: 'Create a profile', best: 'Best match', soonest: 'Soonest first', chooseFeed: 'Choose event feed', forYou: 'For you', allEvents: 'All events', filter: 'Filter events', all: 'All', submitted: 'Community submitted', because: 'Because you like {category} events', postedBy: 'Posted by {organizer}. Confirm details with the organizer before attending.', addCalendar: 'Add to calendar', eventLink: 'Event link', official: 'Official event details', remove: 'Remove my event', empty: 'No events match this view', emptyIntro: 'Try another category or switch back to all events.', note: 'Official events link to their original source. Community submissions are clearly labeled and should be confirmed with their organizer.', postedToast: 'Your event is now listed as a community submission.', report: 'Report listing', reportSignIn: 'Sign in to report', reported: 'Reported', reportTitle: 'Report this listing', reportAsk: 'Report this listing?', reportYes: 'Yes, report', reportNo: 'Cancel', reporting: 'Sending', reportThanks: 'Thank you. This listing has been reported.', hiddenNotice: 'Hidden from the public calendar after three reports. Only you can see it.', },
    postEvent: { signInTitle: 'Sign in to post an event', signInIntro: 'An account helps neighbors know who shared the listing and lets you manage it later.', eyebrow: 'Community submission', title: 'Post an event', intro: 'Share a gathering, class, meeting or activity with Waxhaw neighbors.', flyerTitle: 'Have a flyer or an email about it?', flyerIntro: 'Paste the text and we will fill in what we can find. Check every field afterwards, and nothing posts until you submit.', flyerPlaceholder: 'Paste the flyer text, a newsletter blurb or an email here', flyerLabel: 'Paste flyer or email text', reading: 'Reading', fill: 'Fill the form', clear: 'Clear', filled: 'Filled in {fields}.', nothingFilled: 'Nothing could be filled in from that text.', stillNeeded: ' Still needed: {fields}.', readError: 'That text could not be read. Fill the form in yourself, or try pasting a shorter section.', fromPlan: 'Started from your event plan. Review the wording, then add the date, time and place.', basics: 'Event basics', basicsIntro: 'Use a clear title and choose the closest category.', eventTitle: 'Event title', titlePlaceholder: 'Neighborhood garden workshop', category: 'Category', description: 'Description', descriptionPlaceholder: 'What will happen, who is it for, and what should people bring?', whenWhere: 'When and where', date: 'Date', starts: 'Starts', ends: 'Ends (optional)', location: 'Location', locationPlaceholder: 'Venue name and street address', planning: 'Help neighbors plan', accessibility: 'Accessibility details', accessibilityPlaceholder: 'Accessible entrance, parking, seating, interpreters, or who to contact', website: 'Event website (optional)', submitted: 'Community-submitted listing', submittedIntro: 'Your event will be labeled with your profile name and kept separate from verified official listings. You can remove it from the calendar at any time.', cancel: 'Cancel', publishing: 'Publishing…', publish: 'Publish event', before: 'Before you post', checkTitle: 'Check the details.', check: 'Dates and locations are the organizer’s responsibility.', inclusiveTitle: 'Make it inclusive.', inclusive: 'Describe accessibility, cost and who the event welcomes.', localTitle: 'Keep it local.', local: 'Events should serve Waxhaw or nearby Union County residents.', publicNote: 'Published events appear on the community calendar for every visitor. You can remove yours at any time.', accessibilityDefault: 'Contact the organizer for accessibility details.', fields: { title: 'title', description: 'description', location: 'location', category: 'category', date: 'date', time: 'time' } },
    signInRequired: { eyebrow: 'Account required', action: 'Sign in or create account', back: 'Back to events' },
    savedPlan: { eyebrow: 'Your saved plan', title: 'Keep your next steps together', intro: 'Saved resources stay on this device. Print the plan or return whenever you are ready.', one: '1 saved resource', many: '{count} saved resources', print: 'Print action plan', call: 'Call', remove: 'Remove', emptyTitle: 'Your plan is ready when you are', emptyIntro: 'Save useful resources as you browse. They will appear here as a clear, printable next-step list.', explore: 'Explore resources', finder: 'Use guided finder' },
    eventPlanner: { eyebrow: 'Event planner', title: 'Plan an event people will show up for', intro: 'Describe what you have in mind. We show you events from nearby counties that worked, why they worked, and turn that into a plan for Waxhaw.', kind: 'What kind of event do you want to host?', ideaPlaceholder: 'A Saturday morning makers market with local food trucks and live music', audience: 'Who is it for?', optional: '(optional)', audiencePlaceholder: 'Families with young kids', size: 'Expected size', unsure: 'Not sure yet', budget: 'Budget', season: 'Season', success: 'What would make it a success?', successPlaceholder: 'Neighbors meet each other and local vendors make sales', looking: 'Looking up similar events', build: 'Build my plan', startOver: 'Start over', hint: "Takes about 15 seconds. Don't include names, phone numbers or addresses.", how: 'How the planner works', describeTitle: 'Describe your event.', describe: 'A sentence is enough. Size and budget sharpen the advice.', elsewhereTitle: 'See what worked elsewhere.', elsewhere: 'A live search finds similar events in other towns, with links to where each detail came from.', waxhawTitle: 'Get a plan for Waxhaw.', waxhaw: 'Steps in order, then one click to start your calendar listing.', searching: 'Searching for similar events and reading what made them work.', planHeading: 'Your event plan', worked: 'What worked elsewhere', source: 'Source', sources: 'Sources', noClose: 'None of our researched examples are close enough to yours to compare fairly. The plan below is still built for your idea.', verified: 'Each example below was researched and checked by our team, and links to where we found it.', noConfirmed: 'We could not confirm real examples with a live search this time, so none are shown. The plan below is still built for your idea.', yourPlan: 'Your plan for Waxhaw', grounded: 'The examples are researched by our team; the steps are AI-written from them.', ungrounded: 'These ideas are AI-generated and were not checked against any source this time.', confirm: 'Confirm permits, venues and costs with the', town: 'Town of Waxhaw', confirmEnd: 'before you book anything.', post: 'Post this event', back: 'Back to the calendar', everyPage: 'Every page the search used', sizes: { 'Under 25 people': 'Under 25 people', '25 to 100 people': '25 to 100 people', '100 to 500 people': '100 to 500 people', 'More than 500 people': 'More than 500 people' }, budgets: { 'Free or almost free': 'Free or almost free', 'Under $500': 'Under $500', '$500 to $5,000': '$500 to $5,000', 'More than $5,000': 'More than $5,000' }, seasons: { 'Not sure yet': 'Not sure yet', Spring: 'Spring', Summer: 'Summer', Fall: 'Fall', Winter: 'Winter' }, failures: { limit: 'You have made several plans in the last hour. Wait a little while, then try again.', offline: 'The planner needs an internet connection to look up other events. Reconnect and try again.', error: 'The planner could not build a plan this time. Try again, or describe your event in a different way.' } },
    popularSearches: ['Food assistance', 'Housing help', 'Mental health', 'After-school programs', 'Senior services'],
    trust: { title: 'Built on verified local information', body: 'Sources are clearly labeled, and every listing shows when it was checked.', link: 'See our sources' },
    pageTitles: {
      '/': '', '/resources': 'Resource directory', '/finder': 'Guided resource finder', '/events': 'Community events',
      '/events/new': 'Post a community event', '/events/plan': 'Event planner', '/login': 'Sign in',
      '/account': 'Your account', '/saved': 'Your saved plan', '/about': 'Sources and methodology', '/urgent': 'Urgent support',
    },
    urgentPage: {
      eyebrow: 'Urgent support', title: 'You do not have to handle this alone',
      intro: 'Use the options below for immediate assistance. If someone is in immediate danger or needs emergency medical help, call 911.',
      safetyTitle: 'Safety and privacy',
      safetyBody: 'If you are viewing this page in an unsafe situation, use a device the other person cannot access when possible. Browser history may record your visit. Turning Point keeps its shelter location confidential.',
      safetyLink: 'Visit Turning Point',
      disclaimerLead: 'This directory is not an emergency service.',
      disclaimerBody: 'Information is provided to help residents find official support. Availability and eligibility can change, so confirm details with the provider.',
    },
    auth: {
      eyebrow: 'Your Waxhaw', title: 'A calendar that gets to know you',
      intro: 'Save your interests, see better event matches, and share gatherings with the community.',
      points: ['Recommendations based only on interests you choose', 'Clear reasons for every suggested event', 'One account, on any device you sign in from'],
      tabs: 'Account access', signIn: 'Sign in', create: 'Create account',
      createHeading: 'Create your free account', signInHeading: 'Welcome back',
      createIntro: 'A few details will make your event feed useful from day one.',
      signInIntro: 'Sign in to see your interests and community posts.',
      name: 'Full name', namePlaceholder: 'Jordan Lee', email: 'Email address', password: 'Password',
      passwordPlaceholder: 'At least 8 characters', wait: 'Please wait…',
      shortPassword: 'Use at least 8 characters for your password.',
      noInterests: 'Choose at least one event interest.',
      unavailable: 'Accounts are unavailable right now. You can still browse every resource, use the guided finder and build a saved plan on this device.',
      privacy: 'Your password is handled by a secure authentication service and never stored by this website. We keep only your name and the event interests you choose.',
      interestsLegend: 'What kinds of events interest you?', interestsHint: 'Choose as many as you like. You can change these later.',
    },
    account: {
      eyebrow: 'Your account', hello: 'Hello', intro: 'Control what shapes your recommendations and manage your community participation.',
      personalizedTitle: 'Personalized event feed', personalizedHint: 'Bring your selected interests to the top of the calendar.',
      saving: 'Saving…', save: 'Save preferences', signOut: 'Sign out',
      howTitle: 'How recommendations work',
      howBody: 'compares the categories you choose with each event’s category. Matches move higher in your feed and always include a plain-language reason.',
      howPrivacy: 'We do not infer sensitive traits or track activity across other websites.',
      feedLink: 'See my event feed',
      signInTitle: 'Sign in to manage your profile',
      signInIntro: 'Your interests and community event posts are tied to your account.',
    },
    accessibility: 'Accessibility', signIn: 'Sign in',
    aboutPage: {
      eyebrow: 'About', title: 'Trust should be visible',
      intro: 'A community directory is only useful when people can understand where information came from, when it was checked and what to do next.',
      purposeTitle: 'What this website is for',
      purposeBody: 'brings organizations, programs, services, events and community resources into one inclusive experience. It supports residents across ages, abilities, backgrounds and levels of digital confidence.',
      methodTitle: 'How information is selected',
      steps: [
        ['Start with authoritative sources', 'Official government, school, nonprofit and service-provider pages are preferred.'],
        ['Write for real decisions', 'Each listing explains what the resource does, who it may serve, cost, contact details and what to confirm.'],
        ['Show provenance', 'Every detail page links to its original source and displays the most recent review date.'],
        ['Design for change', 'Residents are reminded to verify details because hours, eligibility and availability can change.'],
      ],
      sourcesTitle: 'Professionally legitimate sources',
      asideTitle: 'Inclusive by default',
      asideBody: 'The interface targets WCAG 2.2 Level AA with semantic landmarks, keyboard navigation, visible focus, contrast-safe colors, reduced motion, scalable text and plain language.',
      watchTitle: 'What we watch',
      watch: [
        'Whether residents finish the guided finder',
        'Searches that return nothing useful',
        'How long it takes to reach a phone number',
        'Task success on a phone and with a screen reader',
      ],
    },
    aboutMetrics: { link: 'See the current numbers', reviewed: 'Directory reviewed September 11, 2026', heading: 'How we measure success', intro: 'These figures are calculated live rather than written down. The directory numbers come from the listings themselves, and the speed numbers are measured on your device while you read this page.', content: 'Content quality', build: 'Build quality', speed: 'Speed on your device right now', target: 'Target', met: 'Target met', missed: 'Below target', context: 'For context', notMeasured: 'Not measured yet', measuring: 'Measuring', good: 'Good', orLess: 'or less', note: 'Interaction to next paint only appears once you have tapped or clicked something on this page. These measurements stay in your browser and are never sent anywhere.', testsValue: '{tests} across {files} files', buildRows: [{ label: 'Automated tests that run before every change', target: '50 or more', note: 'They cover the directory data, accounts, distances, event handling and the AI guardrails.' }, { label: 'Accessibility violations found in the last audit', target: '0', note: 'Automated axe-core scan against WCAG 2.2 AA on every page, in light and dark mode, at desktop and phone widths. Last run {date}.' }, { label: 'Third-party requests when a page loads', target: '0', note: 'Fonts, icons and colors all ship with the site, so no visitor data reaches another company and the site still works offline.' }], directoryRows: [{ label: 'Listings with a link to their original source', note: 'A resident can check every claim against the organization that made it.' }, { label: 'Listings verified in the last 90 days', note: 'Hours, eligibility and phone numbers change, so an unchecked listing is a wrong listing.' }, { label: 'Listings written in English and Spanish', note: 'Union County households speak Spanish at home in meaningful numbers.' }, { label: 'Days since the last directory review', note: 'Measured from the newest verification date in the directory.' }, { label: 'Upcoming events on the calendar', note: 'Past events are removed automatically, so this figure only counts events a resident could still attend.' }, { label: 'Listings a resident can travel to', note: 'The rest are phone, countywide or online services, plus one shelter whose location is confidential.' }], vitals: { lcp: { label: 'Largest contentful paint', hint: 'How long until the main content appears.' }, inp: { label: 'Interaction to next paint', hint: 'How quickly the page answers a tap or click.' }, cls: { label: 'Cumulative layout shift', hint: 'How much the page moves around while loading.' } } },
    distance: { directions: 'Get directions', newTab: ' (opens in a new tab)', distanceExact: 'Straight-line distance from your location', distanceZip: 'Approximate straight-line distance based on ZIP code', error1: 'Location access is off for this site. Enter a ZIP code instead.', error2: 'Your device could not find its location. Enter a ZIP code instead.', error3: 'Finding your location took too long. Try again or enter a ZIP code.', unavailable: 'Location is not available on this device. Enter a ZIP code instead.', invalidZip: 'Enter a 5-digit ZIP code, like 28173.', unsupportedZip: 'Distances are available for ZIP codes within about 45 miles of Waxhaw.', distancesFrom: 'Distances from', currentLocation: 'your current location', change: 'Change', stop: 'Stop showing distances', howFar: 'How far away is it?', zip: 'ZIP code', show: 'Show distances', or: 'or', locating: 'Locating', useLocation: 'Use my location', cancel: 'Cancel', hint: 'Your location stays in this browser. Distances are straight-line, not driving.', sort: 'Sort', nearest: 'Nearest first', within: 'Within', anyDistance: 'Any distance', mile: 'mile', miles: 'miles', inZip: 'In your ZIP code', under: 'Under 0.1 mi', underSpoken: 'Under 0.1 miles away', exactSpoken: '{miles} miles away', about: 'About {miles} mi', aboutSpoken: 'About {miles} {unit} away' },
    eventCategories: { Music: 'Music', Family: 'Family', Festival: 'Festival', Civic: 'Civic', Learning: 'Learning', Wellness: 'Wellness', Volunteering: 'Volunteering', Sports: 'Sports', 'Arts & Culture': 'Arts & Culture' },
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
    darkMode: 'Modo oscuro', lightMode: 'Modo claro', switchDark: 'Cambiar a modo oscuro', switchLight: 'Cambiar a modo claro', theme: 'Apariencia', themeSystem: 'Dispositivo', themeLight: 'Claro', themeDark: 'Oscuro',
    assist: { needHelp: '¿Necesita ayuda?', communityHelper: 'Ayudante comunitario', closeHelper: 'Cerrar ayudante', planningTitle: '¿Está planificando un evento comunitario?', planningIntro: 'Vea qué hizo funcionar eventos similares en otras ciudades y obtenga un plan paso a paso para Waxhaw.', openPlanner: 'Abrir el planificador de eventos', panel: { heading: 'Describa su situación', intro: 'Si no sabe qué buscar, cuéntenos con sus propias palabras lo que sucede y le mostraremos opciones que podrían servirle.', label: '¿Qué está sucediendo?', placeholder: 'Por ejemplo: mi madre dejó de conducir y no puede llegar a sus citas', looking: 'Buscando', find: 'Buscar opciones', hint: 'Las sugerencias provienen del directorio verificado de este sitio. Cada detalle que aparece abajo viene del anuncio original.', loading: 'Buscando en el directorio.', oneResult: 'A continuación aparece 1 opción sugerida.', manyResults: 'A continuación aparecen {count} opciones sugeridas.', noMatch: 'No se encontró una coincidencia cercana.', urgentStatus: 'Las opciones de ayuda urgente aparecen abajo.', urgentTitle: 'Si alguien está en peligro, busque ayuda ahora', urgentIntro: 'Llame al 911 en una emergencia. Llame o envíe un mensaje de texto al 988 para comunicarse con la Línea de Prevención del Suicidio y Crisis.', urgentLink: 'Ver ayuda urgente', fallback: 'Se muestran coincidencias por palabras clave. La guía personalizada puede funcionar mejor.', emptyTitle: 'No pudimos encontrar una coincidencia cercana', emptyIntro: 'Pruebe la guía personalizada o llame a NC 211 para hablar con un especialista.', finderLink: 'Usar la guía personalizada' } },
    resourcesPage: { title: 'Encuentre el apoyo indicado', intro: 'Busque organizaciones, programas y servicios confiables que atienden a Waxhaw y Union County.', filters: 'Filtros', filtersLabel: 'Filtros de recursos', filterResources: 'Filtrar recursos', clearAll: 'Borrar todo', topic: 'Tema', allTopics: 'Todos los temas', audience: '¿Para quién es?', everyone: 'Todas las personas', children: 'Niños', families: 'Familias', adults: 'Adultos', olderAdults: 'Adultos mayores', veterans: 'Veteranos', cost: 'Costo', anyCost: 'Cualquier costo', free: 'Gratis o solicitud gratuita', varies: 'Varía', filterHelp: '¿No sabe qué filtros usar?', filterHelpIntro: 'Nuestra guía personalizada hace preguntas en lenguaje sencillo.', helpChoose: 'Ayúdeme a elegir', checked: 'Revisado' },
    footer: { intro: 'Un lugar acogedor para los recursos, eventos y oportunidades de Waxhaw.', findSupport: 'Encuentre apoyo', resourceDirectory: 'Directorio de recursos', guidedFinder: 'Guía personalizada', urgentHelp: 'Ayuda urgente', community: 'Comunidad', events: 'Eventos', savedPlan: 'Plan guardado', sourcesMethod: 'Fuentes y método', alwaysAvailable: 'Siempre disponible', call211: 'Llamar a NC 211', call988: 'Llamar o enviar un mensaje al 988', emergency: 'Emergencias: 911', project: 'es un proyecto comunitario independiente diseñado por estudiantes.', tagline: 'Arraigado en la comunidad. Enfocado en lo que sigue.' },
    verificationReviewed: 'Directorio revisado el',
    savedPreview: { title: 'Su plan guardado', one: 'Tiene 1 recurso listo para cuando lo necesite.', many: 'Tiene {count} recursos listos para cuando los necesite.', empty: 'Guarde recursos y cree una lista práctica de próximos pasos.', view: 'Ver sus elementos guardados' },
    resourceDetail: { back: 'Volver a todos los recursos', call: 'Llamar al', visit: 'Visitar el sitio del proveedor', saved: 'Guardado en el plan', save: 'Guardar en el plan', verify: 'Información que puede verificar', source: 'Fuente', checked: 'Revisado', original: 'Ver la fuente original', help: 'Cómo puede ayudar este recurso', hours: 'Horario', location: 'Ubicación', cost: 'Costo', languages: 'Idiomas', before: 'Antes de comunicarse', confirm: 'Llame o consulte el sitio web del proveedor para confirmar los requisitos, el horario y los documentos necesarios.', accommodations: 'Pregunte por adaptaciones de idioma o discapacidad al programar.', referral: 'Si este recurso no es adecuado, llame a NC 211 para obtener una recomendación personalizada.', next: 'Su próximo paso', handy: 'Tenga los detalles a mano', handyIntro: 'Imprima esta página o guarde el recurso en su plan de acción personal.', print: 'Imprimir este recurso', openPlan: 'Abrir el plan guardado', more: 'Más opciones', related: 'Recursos relacionados' },
    finderPage: { eyebrow: 'Guía personalizada de recursos', title: 'Unas preguntas. Un próximo paso más claro.', resultsTitle: 'Estos son algunos lugares para comenzar.', intro: 'No hay formularios ni cuentas, y no se guarda información personal.', resultsIntro: 'Estas sugerencias se basan en sus respuestas. Confirme siempre los requisitos con el proveedor.', question: 'Pregunta', of: 'de', progress: 'Progreso de la guía personalizada', previous: 'Pregunta anterior', suggestions: 'Sus puntos de partida sugeridos', need: 'Necesidad', priority: 'Prioridad', startOver: 'Comenzar de nuevo', broaden: 'Ampliemos la búsqueda', broadenIntro: 'Todavía no tenemos una opción exacta en esta categoría. NC 211 puede conectarle con un especialista verificado.', browse: 'Ver todos los recursos', print: 'Imprimir sugerencias', every: 'Ver todos los recursos coincidentes', private: 'Privado desde el diseño', privateIntro: 'Sus respuestas permanecen en este navegador y no se envían a ningún sitio.', questions: [{ title: '¿Qué haría la mayor diferencia hoy?', hint: 'Elija la opción más cercana. Después podrá explorar otras necesidades.' }, { title: '¿Para quién busca apoyo?', hint: 'Esto nos ayuda a mostrar información sobre los requisitos.' }, { title: '¿Qué es lo más importante ahora?', hint: 'Daremos prioridad a los recursos según esta preferencia.' }], who: { all: 'Para mí o cualquier persona', children: 'Un niño o adolescente', families: 'Una familia', older: 'Un adulto mayor', veterans: 'Un veterano o miembro de las fuerzas armadas' }, priorities: { fast: 'Disponible lo antes posible', free: 'Apoyo gratuito o de bajo costo', local: 'Lo más cerca de Waxhaw', language: 'Apoyo de idioma o acceso' } },
    eventsPage: { eyebrow: 'Calendario comunitario', title: 'Participe en lo que importa', intro: 'Eventos oficiales y publicados por vecinos que unen a Waxhaw.', post: 'Publicar un evento', plan: 'Planificar un evento', signIn: 'Iniciar sesión para ver recomendaciones', yourCalendar: 'Su calendario', picked: 'Selecciones para {name}', paused: 'La personalización está pausada', matching: 'Coincide con sus intereses en {interests}.', chooseInterests: 'Elija algunos intereses para comenzar a recibir recomendaciones personales.', chronological: 'Su calendario está en orden cronológico hasta que reactive las recomendaciones.', edit: 'Editar intereses', makeYours: 'Hágalo suyo', discover: 'Encuentre más eventos que le encantarán', discoverIntro: 'Elija sus intereses y pondremos las mejores coincidencias al principio.', create: 'Crear un perfil', best: 'Mejor coincidencia', soonest: 'Más próximos primero', chooseFeed: 'Elegir vista de eventos', forYou: 'Para usted', allEvents: 'Todos los eventos', filter: 'Filtrar eventos', all: 'Todos', submitted: 'Enviado por la comunidad', because: 'Porque le gustan los eventos de {category}', postedBy: 'Publicado por {organizer}. Confirme los detalles con el organizador antes de asistir.', addCalendar: 'Agregar al calendario', eventLink: 'Enlace del evento', official: 'Detalles oficiales del evento', remove: 'Eliminar mi evento', empty: 'Ningún evento coincide con esta vista', emptyIntro: 'Pruebe otra categoría o vuelva a todos los eventos.', note: 'Los eventos oficiales enlazan a su fuente original. Los envíos de la comunidad están claramente identificados y deben confirmarse con el organizador.', postedToast: 'Su evento ahora aparece como un envío de la comunidad.', report: 'Reportar publicación', reportSignIn: 'Inicie sesión para reportar', reported: 'Reportado', reportTitle: 'Reportar esta publicación', reportAsk: '¿Reportar esta publicación?', reportYes: 'Sí, reportar', reportNo: 'Cancelar', reporting: 'Enviando', reportThanks: 'Gracias. Esta publicación fue reportada.', hiddenNotice: 'Oculta del calendario público después de tres reportes. Solo usted puede verla.', },
    postEvent: { signInTitle: 'Inicie sesión para publicar un evento', signInIntro: 'Una cuenta ayuda a sus vecinos a saber quién compartió el anuncio y le permite administrarlo después.', eyebrow: 'Envío comunitario', title: 'Publicar un evento', intro: 'Comparta una reunión, clase, encuentro o actividad con sus vecinos de Waxhaw.', flyerTitle: '¿Tiene un volante o correo electrónico sobre el evento?', flyerIntro: 'Pegue el texto y completaremos lo que podamos encontrar. Revise todos los campos después; nada se publicará hasta que lo envíe.', flyerPlaceholder: 'Pegue aquí el texto del volante, boletín o correo electrónico', flyerLabel: 'Pegar texto de un volante o correo electrónico', reading: 'Leyendo', fill: 'Completar el formulario', clear: 'Borrar', filled: 'Se completó: {fields}.', nothingFilled: 'No se pudo completar ningún campo con ese texto.', stillNeeded: ' Aún falta: {fields}.', readError: 'No se pudo leer ese texto. Complete el formulario usted mismo o pegue una sección más corta.', fromPlan: 'Comenzó desde su plan de evento. Revise el texto y agregue la fecha, la hora y el lugar.', basics: 'Datos básicos del evento', basicsIntro: 'Use un título claro y elija la categoría más cercana.', eventTitle: 'Título del evento', titlePlaceholder: 'Taller de jardinería del vecindario', category: 'Categoría', description: 'Descripción', descriptionPlaceholder: '¿Qué sucederá, para quién es y qué deben llevar las personas?', whenWhere: 'Cuándo y dónde', date: 'Fecha', starts: 'Comienza', ends: 'Termina (opcional)', location: 'Ubicación', locationPlaceholder: 'Nombre del lugar y dirección', planning: 'Ayude a sus vecinos a planificar', accessibility: 'Detalles de accesibilidad', accessibilityPlaceholder: 'Entrada accesible, estacionamiento, asientos, intérpretes o persona de contacto', website: 'Sitio web del evento (opcional)', submitted: 'Anuncio enviado por la comunidad', submittedIntro: 'Su evento se identificará con el nombre de su perfil y se mantendrá separado de los anuncios oficiales verificados. Puede eliminarlo del calendario en cualquier momento.', cancel: 'Cancelar', publishing: 'Publicando…', publish: 'Publicar evento', before: 'Antes de publicar', checkTitle: 'Revise los detalles.', check: 'Las fechas y ubicaciones son responsabilidad del organizador.', inclusiveTitle: 'Hágalo inclusivo.', inclusive: 'Describa la accesibilidad, el costo y a quién recibe el evento.', localTitle: 'Manténgalo local.', local: 'Los eventos deben servir a residentes de Waxhaw o del área cercana de Union County.', publicNote: 'Los eventos publicados aparecen en el calendario comunitario para todos los visitantes. Puede eliminar el suyo en cualquier momento.', accessibilityDefault: 'Comuníquese con el organizador para conocer los detalles de accesibilidad.', fields: { title: 'título', description: 'descripción', location: 'ubicación', category: 'categoría', date: 'fecha', time: 'hora' } },
    signInRequired: { eyebrow: 'Cuenta requerida', action: 'Iniciar sesión o crear una cuenta', back: 'Volver a eventos' },
    savedPlan: { eyebrow: 'Su plan guardado', title: 'Mantenga juntos sus próximos pasos', intro: 'Los recursos guardados permanecen en este dispositivo. Imprima el plan o vuelva cuando esté listo.', one: '1 recurso guardado', many: '{count} recursos guardados', print: 'Imprimir plan de acción', call: 'Llamar', remove: 'Eliminar', emptyTitle: 'Su plan está listo cuando usted lo esté', emptyIntro: 'Guarde recursos útiles mientras explora. Aparecerán aquí como una lista clara e imprimible de próximos pasos.', explore: 'Explorar recursos', finder: 'Usar la guía personalizada' },
    eventPlanner: { eyebrow: 'Planificador de eventos', title: 'Planifique un evento al que la gente quiera asistir', intro: 'Describa lo que tiene en mente. Le mostramos eventos de condados cercanos que funcionaron, por qué funcionaron y ciudades, mostramos por qué funcionaron y convertimos esa información en un plan para Waxhaw.', kind: '¿Qué tipo de evento quiere organizar?', ideaPlaceholder: 'Un mercado de creadores el sábado por la mañana con camiones de comida local y música en vivo', audience: '¿Para quién es?', optional: '(opcional)', audiencePlaceholder: 'Familias con niños pequeños', size: 'Tamaño esperado', unsure: 'Aún no lo sé', budget: 'Presupuesto', season: 'Temporada', success: '¿Qué haría que fuera un éxito?', successPlaceholder: 'Los vecinos se conocen y los vendedores locales logran ventas', looking: 'Buscando eventos similares', build: 'Crear mi plan', startOver: 'Comenzar de nuevo', hint: 'Tarda unos 15 segundos. No incluya nombres, números de teléfono ni direcciones.', how: 'Cómo funciona el planificador', describeTitle: 'Describa su evento.', describe: 'Una oración es suficiente. El tamaño y el presupuesto mejoran las recomendaciones.', elsewhereTitle: 'Vea qué funcionó en otros lugares.', elsewhere: 'Una búsqueda en vivo encuentra eventos similares en otras ciudades, con enlaces a la fuente de cada detalle.', waxhawTitle: 'Obtenga un plan para Waxhaw.', waxhaw: 'Pasos en orden y luego un clic para comenzar su anuncio en el calendario.', searching: 'Buscando eventos similares y analizando qué los hizo funcionar.', planHeading: 'Su plan de evento', worked: 'Lo que funcionó en otros lugares', source: 'Fuente', sources: 'Fuentes', noClose: 'Ninguno de nuestros ejemplos investigados se parece lo suficiente al suyo para compararlo bien. El plan de abajo sigue hecho para su idea.', verified: 'Cada ejemplo de abajo fue investigado y verificado por nuestro equipo, y enlaza a la fuente donde lo encontramos.', noConfirmed: 'Esta vez no pudimos confirmar ejemplos reales con una búsqueda en vivo, así que no se muestra ninguno. El plan de abajo sigue adaptado a su idea.', yourPlan: 'Su plan para Waxhaw', grounded: 'Los ejemplos fueron investigados por nuestro equipo; los pasos los redactó la IA a partir de ellos.', ungrounded: 'Estas ideas fueron generadas por IA y esta vez no se comprobaron con ninguna fuente.', confirm: 'Confirme los permisos, lugares y costos con el', town: 'Town of Waxhaw', confirmEnd: 'antes de reservar.', post: 'Publicar este evento', back: 'Volver al calendario', everyPage: 'Todas las páginas utilizadas en la búsqueda', sizes: { 'Under 25 people': 'Menos de 25 personas', '25 to 100 people': 'De 25 a 100 personas', '100 to 500 people': 'De 100 a 500 personas', 'More than 500 people': 'Más de 500 personas' }, budgets: { 'Free or almost free': 'Gratis o casi gratis', 'Under $500': 'Menos de $500', '$500 to $5,000': 'De $500 a $5,000', 'More than $5,000': 'Más de $5,000' }, seasons: { 'Not sure yet': 'Aún no lo sé', Spring: 'Primavera', Summer: 'Verano', Fall: 'Otoño', Winter: 'Invierno' }, failures: { limit: 'Ha creado varios planes durante la última hora. Espere un poco y vuelva a intentarlo.', offline: 'El planificador necesita conexión a internet para buscar otros eventos. Vuelva a conectarse e inténtelo de nuevo.', error: 'El planificador no pudo crear un plan esta vez. Inténtelo de nuevo o describa su evento de otra manera.' } },
    popularSearches: ['Ayuda con comida', 'Ayuda con vivienda', 'Salud mental', 'Programas después de clases', 'Servicios para adultos mayores'],
    trust: { title: 'Basado en información local verificada', body: 'Las fuentes están claramente indicadas y cada ficha muestra cuándo se revisó.', link: 'Ver nuestras fuentes' },
    pageTitles: {
      '/': '', '/resources': 'Directorio de recursos', '/finder': 'Guía personalizada', '/events': 'Eventos comunitarios',
      '/events/new': 'Publicar un evento', '/events/plan': 'Planificador de eventos', '/login': 'Iniciar sesión',
      '/account': 'Su cuenta', '/saved': 'Su plan guardado', '/about': 'Fuentes y metodología', '/urgent': 'Ayuda urgente',
    },
    urgentPage: {
      eyebrow: 'Ayuda urgente', title: 'No tiene que enfrentar esto solo',
      intro: 'Use las opciones de abajo para recibir ayuda inmediata. Si alguien está en peligro inmediato o necesita atención médica de emergencia, llame al 911.',
      safetyTitle: 'Seguridad y privacidad',
      safetyBody: 'Si está viendo esta página en una situación insegura, use si es posible un dispositivo al que la otra persona no tenga acceso. El historial del navegador puede registrar su visita. Turning Point mantiene confidencial la ubicación de su refugio.',
      safetyLink: 'Visitar Turning Point',
      disclaimerLead: 'Este directorio no es un servicio de emergencia.',
      disclaimerBody: 'La información se ofrece para ayudar a los residentes a encontrar apoyo oficial. La disponibilidad y los requisitos pueden cambiar, así que confirme los detalles con el proveedor.',
    },
    auth: {
      eyebrow: 'Su Waxhaw', title: 'Un calendario que lo conoce',
      intro: 'Guarde sus intereses, reciba mejores sugerencias de eventos y comparta reuniones con la comunidad.',
      points: ['Recomendaciones basadas solo en los intereses que usted elige', 'Una razón clara para cada evento sugerido', 'Una sola cuenta, en cualquier dispositivo donde inicie sesión'],
      tabs: 'Acceso a la cuenta', signIn: 'Iniciar sesión', create: 'Crear cuenta',
      createHeading: 'Cree su cuenta gratuita', signInHeading: 'Bienvenido de nuevo',
      createIntro: 'Con unos pocos datos su calendario será útil desde el primer día.',
      signInIntro: 'Inicie sesión para ver sus intereses y sus publicaciones.',
      name: 'Nombre completo', namePlaceholder: 'Jordan Lee', email: 'Correo electrónico', password: 'Contraseña',
      passwordPlaceholder: 'Al menos 8 caracteres', wait: 'Un momento…',
      shortPassword: 'Use al menos 8 caracteres para su contraseña.',
      noInterests: 'Elija al menos un interés.',
      unavailable: 'Las cuentas no están disponibles en este momento. Todavía puede ver todos los recursos, usar la guía personalizada y armar un plan guardado en este dispositivo.',
      privacy: 'Su contraseña la maneja un servicio de autenticación seguro y este sitio nunca la guarda. Solo conservamos su nombre y los intereses que elija.',
      interestsLegend: '¿Qué tipo de eventos le interesan?', interestsHint: 'Elija los que quiera. Puede cambiarlos después.',
    },
    account: {
      eyebrow: 'Su cuenta', hello: 'Hola', intro: 'Controle lo que influye en sus recomendaciones y administre su participación en la comunidad.',
      personalizedTitle: 'Calendario personalizado', personalizedHint: 'Pone los intereses que eligió al principio del calendario.',
      saving: 'Guardando…', save: 'Guardar preferencias', signOut: 'Cerrar sesión',
      howTitle: 'Cómo funcionan las recomendaciones',
      howBody: 'compara las categorías que usted elige con la categoría de cada evento. Las coincidencias suben en su calendario y siempre incluyen una razón en lenguaje claro.',
      howPrivacy: 'No deducimos características sensibles ni rastreamos su actividad en otros sitios.',
      feedLink: 'Ver mi calendario',
      signInTitle: 'Inicie sesión para administrar su perfil',
      signInIntro: 'Sus intereses y los eventos que publique están vinculados a su cuenta.',
    },
    accessibility: 'Accesibilidad', signIn: 'Iniciar sesión',
    aboutPage: {
      eyebrow: 'Acerca de', title: 'La confianza debe verse',
      intro: 'Un directorio comunitario solo sirve cuando las personas pueden entender de dónde vino la información, cuándo se revisó y qué hacer después.',
      purposeTitle: 'Para qué sirve este sitio',
      purposeBody: 'reúne organizaciones, programas, servicios, eventos y recursos comunitarios en un solo lugar accesible. Sirve a residentes de todas las edades, capacidades, orígenes y niveles de confianza con la tecnología.',
      methodTitle: 'Cómo se elige la información',
      steps: [
        ['Empezamos por fuentes oficiales', 'Damos preferencia a páginas del gobierno, las escuelas, organizaciones sin fines de lucro y los propios proveedores.'],
        ['Escribimos para decisiones reales', 'Cada ficha explica qué hace el recurso, a quién puede servir, el costo, los datos de contacto y qué conviene confirmar.'],
        ['Mostramos la procedencia', 'Cada página de detalle enlaza a su fuente original y muestra la fecha de la última revisión.'],
        ['Diseñamos para el cambio', 'Recordamos a los residentes que confirmen los detalles, porque los horarios, los requisitos y la disponibilidad cambian.'],
      ],
      sourcesTitle: 'Fuentes legítimas y profesionales',
      asideTitle: 'Accesible desde el principio',
      asideBody: 'La interfaz apunta al nivel AA de las WCAG 2.2, con estructura semántica, navegación por teclado, foco visible, colores con buen contraste, movimiento reducido, texto ampliable y lenguaje claro.',
      watchTitle: 'Lo que vigilamos',
      watch: [
        'Si los residentes terminan la guía personalizada',
        'Búsquedas que no devuelven nada útil',
        'Cuánto tarda alguien en llegar a un número de teléfono',
        'El éxito de las tareas en el teléfono y con lector de pantalla',
      ],
    },
    aboutMetrics: { link: 'Ver las cifras actuales', reviewed: 'Directorio revisado el 11 de septiembre de 2026', heading: 'Cómo medimos el éxito', intro: 'Estas cifras se calculan en vivo, no se escriben manualmente. Los números del directorio provienen de los propios anuncios y las cifras de velocidad se miden en su dispositivo mientras lee esta página.', content: 'Calidad del contenido', build: 'Calidad de la compilación', speed: 'Velocidad en su dispositivo ahora mismo', target: 'Objetivo', met: 'Objetivo cumplido', missed: 'Por debajo del objetivo', context: 'Como referencia', notMeasured: 'Aún no medido', measuring: 'Midiendo', good: 'Bueno', orLess: 'o menos', note: 'La interacción hasta la siguiente pintura solo aparece después de tocar o hacer clic en esta página. Estas mediciones permanecen en su navegador y nunca se envían a ningún sitio.', testsValue: '{tests} en {files} archivos', buildRows: [{ label: 'Pruebas automatizadas que se ejecutan antes de cada cambio', target: '50 o más', note: 'Cubren los datos del directorio, las cuentas, las distancias, el manejo de eventos y las medidas de seguridad de la IA.' }, { label: 'Infracciones de accesibilidad encontradas en la última auditoría', target: '0', note: 'Escaneo automatizado con axe-core según WCAG 2.2 AA en cada página, en modo claro y oscuro y con anchos de escritorio y teléfono. Última ejecución: {date}.' }, { label: 'Solicitudes a terceros al cargar una página', target: '0', note: 'Las fuentes, los iconos y los colores vienen incluidos con el sitio, por lo que ningún dato del visitante llega a otra empresa y el sitio sigue funcionando sin conexión.' }], directoryRows: [{ label: 'Anuncios con enlace a su fuente original', note: 'Cada residente puede comprobar las afirmaciones con la organización que las publicó.' }, { label: 'Anuncios verificados en los últimos 90 días', note: 'Los horarios, los requisitos y los números de teléfono cambian; un anuncio sin revisar puede ser incorrecto.' }, { label: 'Anuncios escritos en inglés y español', note: 'Una cantidad significativa de hogares de Union County habla español en casa.' }, { label: 'Días desde la última revisión del directorio', note: 'Se mide desde la fecha de verificación más reciente del directorio.' }, { label: 'Próximos eventos en el calendario', note: 'Los eventos pasados se eliminan automáticamente, por lo que esta cifra solo cuenta los eventos a los que todavía se puede asistir.' }, { label: 'Anuncios a los que un residente puede desplazarse', note: 'Los demás son servicios telefónicos, del condado o en línea, además de un refugio cuya ubicación es confidencial.' }], vitals: { lcp: { label: 'Renderizado del contenido principal', hint: 'Cuánto tarda en aparecer el contenido principal.' }, inp: { label: 'Interacción hasta la siguiente pintura', hint: 'Con qué rapidez responde la página a un toque o clic.' }, cls: { label: 'Cambio acumulado de diseño', hint: 'Cuánto se mueve la página mientras carga.' } } },
    distance: { directions: 'Cómo llegar', newTab: ' (se abre en una pestaña nueva)', distanceExact: 'Distancia en línea recta desde su ubicación', distanceZip: 'Distancia aproximada en línea recta según el código postal', error1: 'El acceso a la ubicación está desactivado para este sitio. Ingrese un código postal.', error2: 'Su dispositivo no pudo encontrar su ubicación. Ingrese un código postal.', error3: 'La búsqueda de su ubicación tardó demasiado. Inténtelo de nuevo o ingrese un código postal.', unavailable: 'La ubicación no está disponible en este dispositivo. Ingrese un código postal.', invalidZip: 'Ingrese un código postal de 5 dígitos, como 28173.', unsupportedZip: 'Las distancias están disponibles para códigos postales ubicados a unas 45 millas de Waxhaw.', distancesFrom: 'Distancias desde', currentLocation: 'su ubicación actual', change: 'Cambiar', stop: 'Dejar de mostrar distancias', howFar: '¿A qué distancia está?', zip: 'Código postal', show: 'Mostrar distancias', or: 'o', locating: 'Buscando', useLocation: 'Usar mi ubicación', cancel: 'Cancelar', hint: 'Su ubicación permanece en este navegador. Las distancias son en línea recta, no por carretera.', sort: 'Ordenar', nearest: 'Más cercanos primero', within: 'Dentro de', anyDistance: 'Cualquier distancia', mile: 'milla', miles: 'millas', inZip: 'En su código postal', under: 'Menos de 0.1 mi', underSpoken: 'A menos de 0.1 millas de distancia', exactSpoken: '{miles} millas de distancia', about: 'Aprox. {miles} mi', aboutSpoken: 'Aproximadamente {miles} {unit} de distancia' },
    eventCategories: { Music: 'Música', Family: 'Familia', Festival: 'Festival', Civic: 'Cívico', Learning: 'Aprendizaje', Wellness: 'Bienestar', Volunteering: 'Voluntariado', Sports: 'Deportes', 'Arts & Culture': 'Arte y cultura' },
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

const latestVerificationDate = resources.reduce((latest, resource) => {
  if (!latest || Date.parse(resource.verified) > Date.parse(latest)) return resource.verified
  return latest
}, '')

function formatVerificationDate(dateText, language) {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText
  return date.toLocaleDateString(language, { month: 'long', day: 'numeric', year: 'numeric' })
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

/* Browser chrome color for each theme, matching --fill-deep. */
const THEME_COLORS = { light: '#173f35', dark: '#000b05' }

/** Turns 'system' into what the device is actually showing, and follows changes. */
function useResolvedTheme(theme) {
  const query = '(prefers-color-scheme: dark)'
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return undefined
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  if (theme === 'dark' || theme === 'light') return theme
  return systemDark ? 'dark' : 'light'
}

function App() {
  const [saved, setSaved] = useStoredState('waxhaw-saved', [])
  const [language, setLanguage] = useStoredState('waxhaw-language', 'en')
  const [preferences, setPreferences] = useStoredState('waxhaw-accessibility', {
    text: 'normal', contrast: false, reducedMotion: false, theme: 'system',
  })
  const theme = preferences.theme || 'system'
  const resolvedTheme = useResolvedTheme(theme)
  const [compare, setCompare] = useState([])
  const [authUser, setAuthUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authStatus, setAuthStatus] = useState(isBackendConfigured ? 'loading' : 'unavailable')
  const [postedEvents, setPostedEvents] = useState([])
  const [eventsNotice, setEventsNotice] = useState('')
  const [toast, setToast] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  const distance = useDistanceState()

  useEffect(() => subscribeToAuth(
    (user) => { setAuthUser(user); setAuthStatus('ready') },
    () => { setAuthUser(null); setAuthStatus('unavailable') },
  ), [])

  useEffect(() => {
    if (!authUser) {
      setProfile(null)
      return undefined
    }
    let active = true
    loadProfile(authUser.uid).then((result) => {
      if (!active) return
      setProfile(result.ok ? result.profile : { name: authUser.name, interests: [], personalized: true })
    })
    return () => { active = false }
  }, [authUser])

  useEffect(() => subscribeToCommunityEvents(setPostedEvents, setEventsNotice), [])

  const currentUser = authUser ? {
    id: authUser.uid,
    email: authUser.email,
    name: profile?.name || authUser.name || 'Neighbor',
    interests: profile?.interests || [],
    personalized: profile?.personalized !== false,
  } : null
  /* Recurring town meetings become dated listings here, so the calendar stays
     populated as events pass instead of emptying out. */
  const allEvents = useMemo(
    () => visibleEvents([...expandEvents(events), ...postedEvents], authUser?.uid),
    [postedEvents, authUser?.uid],
  )

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dataset.text = preferences.text
    document.documentElement.dataset.contrast = preferences.contrast ? 'high' : 'normal'
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
    document.documentElement.dataset.theme = theme
  }, [language, preferences, theme])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolvedTheme])
  }, [resolvedTheme])

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

  const register = async ({ name, email, password, interests }) => {
    const result = await createAccount({ name, email, password, interests })
    if (result.ok) setToast('Your account is ready.')
    return result
  }

  const login = async ({ email, password }) => {
    const result = await signInWithEmail({ email, password })
    if (result.ok) setToast('Welcome back.')
    return result
  }

  const signOut = async () => {
    await signOutCurrentUser()
    setToast('You’re signed out.')
  }

  const updateProfile = async (changes) => {
    if (!authUser) return { ok: false, error: 'Sign in to change your preferences.' }
    setProfile((current) => ({ ...current, ...changes }))
    const result = await saveProfile(authUser.uid, changes)
    setToast(result.ok ? 'Your event preferences were saved.' : result.error)
    return result
  }

  const addPostedEvent = (eventItem) => publishCommunityEvent(currentUser, eventItem)

  const reportEvent = async (id) => {
    const result = await reportCommunityEvent(currentUser, id)
    setToast(result.ok ? copy[language].eventsPage.reportThanks : result.error)
    return result
  }

  const removePostedEvent = async (id) => {
    const result = await removeCommunityEvent(id)
    setToast(result.ok ? 'Your community event was removed.' : result.error)
    return result
  }

  const value = {
    saved, toggleSaved, compare, toggleCompare, language, setLanguage, preferences, setPreferences, theme, resolvedTheme,
    setToast, t: copy[language], currentUser, authStatus, eventsNotice, allEvents, register, login,
    signOut, updateProfile, addPostedEvent, removePostedEvent, reportEvent,
  }

  return (
    <AppContext.Provider value={value}>
    <DistanceContext.Provider value={distance}>
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
          <Route path="/events/plan" element={<EventPlannerPage language={language} copy={copy[language].eventPlanner} />} />
          <Route path="/events/new" element={<PostEventPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/urgent" element={<UrgentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <CompareTray />
      <AssistLauncher copy={copy[language].assist} renderResource={(resource) => <ResourceCard resource={resource} compact />} raised={compare.length > 0} />
      <Footer />
      <div className={`toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
    </DistanceContext.Provider>
    </AppContext.Provider>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  const { t } = useContext(AppContext)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const routeTitles = Object.fromEntries(Object.entries(t.pageTitles).map(([route, label]) => [route, route === '/' ? SITE_HOME_TITLE : pageTitle(label)]))
    const detailResource = pathname.startsWith('/resources/') ? resources.find((item) => `/resources/${item.id}` === pathname) : null
    document.title = detailResource ? pageTitle(detailResource.name) : (routeTitles[pathname] || pageTitle('Page not found'))
  }, [pathname, t])
  return null
}

function BrandMark({ compact = false }) {
  return (
    <Link className={`brand ${compact ? 'brand--compact' : ''}`} to="/" aria-label={`${SITE_NAME} home`}>
      <span className="brand__mark" aria-hidden="true"><Leaf /><span /></span>
      <span><strong>{SITE_NAME}</strong><small>{SITE_TAGLINE}</small></span>
    </Link>
  )
}

function Header() {
  const { saved, language, setLanguage, preferences, setPreferences, theme, resolvedTheme, currentUser, t } = useContext(AppContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const isDark = resolvedTheme === 'dark'
  const setTheme = (value) => setPreferences({ ...preferences, theme: value })
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
          <button className="utility-button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={isDark ? t.switchLight : t.switchDark}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? t.lightMode : t.darkMode}
          </button>
          <button className="utility-button" onClick={() => setAccessOpen(!accessOpen)} aria-expanded={accessOpen} aria-controls="accessibility-panel">
            <Accessibility size={17} /> {t.accessibility}
          </button>
          <Link className="utility-button utility-account" to={currentUser ? '/account' : '/login'}>
            {currentUser ? <UserRound size={16} /> : <LogIn size={16} />} {currentUser ? currentUser.name.split(' ')[0] : t.signIn}
          </Link>
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
          <fieldset>
            <legend>{t.theme}</legend>
            <div className="segmented segmented--words">
              {[['system', t.themeSystem], ['light', t.themeLight], ['dark', t.themeDark]].map(([value, label]) => (
                <button key={value} className={theme === value ? 'is-active' : ''} onClick={() => setTheme(value)} aria-pressed={theme === value}>{label}</button>
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
          <div className="popular-searches"><strong>{language === 'en' ? 'Popular searches:' : 'Búsquedas populares:'}</strong>{t.popularSearches.map((item) => <Link key={item} to={`/resources?q=${encodeURIComponent(item)}`}>{item}</Link>)}</div>
        </div>
      </section>
      <UrgentBand />
      <section className="section category-section">
        <div className="section-heading"><div><span className="eyebrow">For every stage of life</span><h2>{t.explore}</h2><p>{t.exploreSub}</p></div><Link to="/resources">{t.viewAll}<ArrowRight size={17} /></Link></div>
        <div className="category-rail">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id]
            return <Link key={category.id} to={`/resources?category=${category.id}`}><span><Icon /></span><strong>{language === 'es' ? category.labelEs : category.label}</strong><small>{language === 'es' ? category.blurbEs : category.blurb}</small></Link>
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
      <section className="trust-strip"><ShieldCheck /><div><strong>{t.trust.title}</strong><span>{t.trust.body}</span></div><Link to="/about#sources">{t.trust.link} <ArrowRight size={17} /></Link></section>
    </>
  )
}

function UrgentBand() {
  const { language, t } = useContext(AppContext)
  return (
    <section className="urgent-band" aria-labelledby="urgent-title">
      <div className="urgent-band__intro"><span><CircleAlert /></span><div><h2 id="urgent-title">{t.urgent}</h2><p>{t.urgentSub}</p></div></div>
      <div className="urgent-band__links">
        {urgentLinks.slice(0, 3).map((item) => <a key={item.label} href={`tel:${item.phone}`}><Phone size={20} /><span><strong>{language === 'es' ? item.labelEs : item.label}</strong><small>{language === 'es' ? item.detailEs : item.detail}</small></span></a>)}
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
      <div className="featured-resource__footer"><Link className="button button--primary" to={`/resources/${resource.id}`}>{t.viewDetails} <ArrowRight size={17} /></Link><span><Info size={16} /> {t.checked} {formatVerificationDate(resource.verified, language)}</span></div>
    </article>
  )
}

function SavedPreview() {
  const { saved, t } = useContext(AppContext)
  const savedMessage = saved.length === 1
    ? t.savedPreview.one
    : saved.length > 1
      ? t.savedPreview.many.replace('{count}', saved.length)
      : t.savedPreview.empty
  return (
    <div className="saved-preview"><Bookmark /><div><h2>{t.savedPreview.title}</h2><p>{savedMessage}</p><Link to="/saved">{t.savedPreview.view} <ArrowRight size={16} /></Link></div></div>
  )
}

function EventsPreview() {
  const { allEvents, t } = useContext(AppContext)
  return (
    <div className="events-preview"><div className="mini-heading"><h2><CalendarDays /> {t.upcoming}</h2><Link to="/events">View all</Link></div>{upcomingEvents(allEvents).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map((event) => <EventRow key={event.id} event={event} />)}</div>
  )
}

function EventRow({ event }) {
  const { language } = useContext(AppContext)
  const date = new Date(`${event.date}T12:00:00`)
  return <div className="event-row"><time dateTime={event.date}><strong>{date.toLocaleDateString(language, { month: 'short' })}</strong><span>{date.getDate()}</span></time><div><strong>{event.title}</strong><small>{event.time} · {event.location}</small></div></div>
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
      <div><span className="resource-card__category">{categories.find((item) => item.id === resource.category)?.[language === 'es' ? 'labelEs' : 'label']}</span><h2><Link to={`/resources/${resource.id}`}>{resource.name}</Link></h2><p>{language === 'es' ? resource.descriptionEs : resource.description}</p></div>
      <div className="resource-meta"><span><MapPin /> {resource.location}</span><DistanceTag item={resource} labels={t.distance} /><span><Clock3 /> {resource.hours}</span><span><Info /> {resource.cost}</span></div>
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
  const [nearestFirst, setNearestFirst] = useState(false)
  const [within, setWithin] = useState(0)
  const { language, t } = useContext(AppContext)
  const { origin } = useContext(DistanceContext)

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
  const clear = () => { setQuery(''); setCategory('all'); setAudience('all'); setCost('all'); setWithin(0); setParams({}) }
  const shown = useMemo(() => arrangeByDistance(results, origin, { sort: nearestFirst, within }), [results, origin, nearestFirst, within])

  return (
    <>
      <PageHero eyebrow="Resource directory" title={t.resourcesPage.title} intro={t.resourcesPage.intro} compact>
        <form className="directory-search" onSubmit={submitSearch} role="search"><label htmlFor="directory-query">What do you need?</label><div><Search /><input id="directory-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try food, rides, child care or benefits" /><button className="button button--primary">{t.search}</button></div></form>
      </PageHero>
      <section className="directory-layout section">
      <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><Filter /> {t.resourcesPage.filters} <ChevronDown /></button>
      <aside className={`filters ${filtersOpen ? 'filters--open' : ''}`} aria-label={t.resourcesPage.filtersLabel}>
        <div className="filter-heading"><h2>{t.resourcesPage.filterResources}</h2><button onClick={clear}>{t.resourcesPage.clearAll}</button></div>
        <label>{t.resourcesPage.topic}<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">{t.resourcesPage.allTopics}</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === 'es' ? item.labelEs : item.label}</option>)}</select></label>
        <label>{t.resourcesPage.audience}<select value={audience} onChange={(e) => setAudience(e.target.value)}><option value="all">{t.resourcesPage.everyone}</option><option value="children">{t.resourcesPage.children}</option><option value="families">{t.resourcesPage.families}</option><option value="adults">{t.resourcesPage.adults}</option><option value="older">{t.resourcesPage.olderAdults}</option><option value="veterans">{t.resourcesPage.veterans}</option></select></label>
        <label>{t.resourcesPage.cost}<select value={cost} onChange={(e) => setCost(e.target.value)}><option value="all">{t.resourcesPage.anyCost}</option><option value="free">{t.resourcesPage.free}</option><option value="varies">{t.resourcesPage.varies}</option></select></label>
        <div className="filter-help"><Compass /><strong>{t.resourcesPage.filterHelp}</strong><p>{t.resourcesPage.filterHelpIntro}</p><Link to="/finder">{t.resourcesPage.helpChoose} <ArrowRight /></Link></div>
      </aside>
      <div className="results">
        <div className="distance-bar"><LocationPicker labels={t.distance} /><DistanceOptions sort={nearestFirst} onSort={setNearestFirst} within={within} onWithin={setWithin} defaultLabel={t.eventsPage.best} labels={t.distance} /></div>
        {origin && within > 0 && <p className="distance-note">Countywide, statewide and phone-based services stay in the list because they serve you wherever you are.</p>}
        <div className="results__heading"><div><span aria-live="polite">{shown.length} resource{shown.length === 1 ? '' : 's'} found</span>{query && <strong> for “{query}”</strong>}</div><span>{t.resourcesPage.checked} {formatVerificationDate(latestVerificationDate, language)}</span></div>
        {shown.length ? <div className="resource-list">{shown.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <div className="empty-state"><Search /><h2>We couldn’t find an exact match</h2><p>Try a broader word, remove a filter, or use the guided finder. You can also call NC 211 for personal help.</p><div><button className="button button--primary" onClick={clear}>Clear search and filters</button><Link className="button button--secondary" to="/finder">Use guided finder</Link></div></div>}
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
        <div className="section"><Link className="back-link" to="/resources"><ArrowLeft /> {t.resourceDetail.back}</Link><div className="detail-hero__grid"><div><div className="detail-kickers"><span className="category-symbol"><Icon /></span><SourceBadge />{open !== null && <span className={open ? 'open-badge' : 'closed-badge'}>{open ? t.openNow : t.closedNow}</span>}</div><h1>{resource.name}</h1><p>{language === 'es' ? resource.descriptionEs : resource.description}</p><div className="detail-actions"><a className="button button--primary" href={`tel:${resource.phone.replace(/[^\d]/g, '')}`}><Phone /> {t.resourceDetail.call} {resource.phone}</a><DirectionsLink item={resource} labels={t.distance} /><a className="button button--secondary" href={resource.sourceUrl} target="_blank" rel="noreferrer">{t.resourceDetail.visit} <ExternalLink /></a><button className={saved.includes(resource.id) ? 'button button--saved' : 'button button--secondary'} onClick={() => toggleSaved(resource.id)}><Bookmark /> {saved.includes(resource.id) ? t.resourceDetail.saved : t.resourceDetail.save}</button></div></div><aside className="verification-card"><BadgeCheck /><strong>{t.resourceDetail.verify}</strong><span>{t.resourceDetail.source}: {resource.source}</span><span>{t.resourceDetail.checked}: {formatVerificationDate(resource.verified, language)}</span><a href={resource.sourceUrl} target="_blank" rel="noreferrer">{t.resourceDetail.original} <ExternalLink /></a></aside></div></div>
      </section>
      <section className="section detail-layout"><article><h2>{t.resourceDetail.help}</h2><p>{resource.details}</p><div className="detail-facts"><div><Clock3 /><span><strong>{t.resourceDetail.hours}</strong>{resource.hours}</span></div><div><MapPin /><span><strong>{t.resourceDetail.location}</strong>{resource.location}<DistanceTag item={resource} labels={t.distance} /></span></div><div><Info /><span><strong>{t.resourceDetail.cost}</strong>{resource.cost}</span></div><div><Globe2 /><span><strong>{t.resourceDetail.languages}</strong>{resource.languages.join(', ')}</span></div></div><h2>{t.resourceDetail.before}</h2><ul className="check-list"><li><Check /> {t.resourceDetail.confirm}</li><li><Check /> {t.resourceDetail.accommodations}</li><li><Check /> {t.resourceDetail.referral}</li></ul></article><aside className="next-step"><span className="eyebrow">{t.resourceDetail.next}</span><h2>{t.resourceDetail.handy}</h2><p>{t.resourceDetail.handyIntro}</p><button className="button button--secondary" onClick={() => window.print()}><Printer /> {t.resourceDetail.print}</button><Link to="/saved">{t.resourceDetail.openPlan} <ArrowRight /></Link></aside></section>
      {!!related.length && <section className="section related"><div className="section-heading"><div><span className="eyebrow">{t.resourceDetail.more}</span><h2>{t.resourceDetail.related}</h2></div></div><div className="related-grid">{related.map((item) => <ResourceCard key={item.id} resource={item} compact />)}</div></section>}
    </>
  )
}

function FinderPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ need: '', who: '', priority: '' })
  const navigate = useNavigate()
  const { language, t } = useContext(AppContext)
  const questions = [
    { key: 'need', ...t.finderPage.questions[0], options: categories.slice(0, 8).map((item) => ({ value: item.id, label: language === 'es' ? item.labelEs : item.label, icon: categoryIcons[item.id] })) },
    { key: 'who', ...t.finderPage.questions[1], options: [{ value: 'all', label: t.finderPage.who.all, icon: Users }, { value: 'children', label: t.finderPage.who.children, icon: Baby }, { value: 'families', label: t.finderPage.who.families, icon: Home }, { value: 'older', label: t.finderPage.who.older, icon: HandHeart }, { value: 'veterans', label: t.finderPage.who.veterans, icon: ShieldCheck }] },
    { key: 'priority', ...t.finderPage.questions[2], options: [{ value: 'fast', label: t.finderPage.priorities.fast, icon: Zap }, { value: 'free', label: t.finderPage.priorities.free, icon: HandHeart }, { value: 'local', label: t.finderPage.priorities.local, icon: MapPin }, { value: 'language', label: t.finderPage.priorities.language, icon: Languages }] },
  ]
  const question = questions[step]
  const { origin } = useContext(DistanceContext)
  const results = useMemo(() => {
    if (step < questions.length) return []
    const matching = resources.filter((item) => item.category === answers.need)
    if (answers.priority === 'local' && origin) return arrangeByDistance(matching, origin, { sort: true }).slice(0, 4)
    return matching.sort((a, b) => {
      if (answers.priority === 'free') return Number(b.cost.toLowerCase().includes('free')) - Number(a.cost.toLowerCase().includes('free'))
      if (answers.priority === 'fast') return Number(Boolean(b.alwaysOpen || b.schedule)) - Number(Boolean(a.alwaysOpen || a.schedule))
      if (answers.priority === 'local') return Number(b.location.toLowerCase().includes('waxhaw')) - Number(a.location.toLowerCase().includes('waxhaw'))
      return b.languages.length - a.languages.length
    }).slice(0, 4)
  }, [step, answers, origin])
  const choose = (value) => { setAnswers({ ...answers, [question.key]: value }); window.setTimeout(() => setStep(step + 1), 150) }
  const reset = () => { setStep(0); setAnswers({ need: '', who: '', priority: '' }) }
  return (
    <>
      <PageHero eyebrow={t.finderPage.eyebrow} title={step < questions.length ? t.finderPage.title : t.finderPage.resultsTitle} intro={step < questions.length ? t.finderPage.intro : t.finderPage.resultsIntro} compact />
      <section className="section finder-shell">
        {step < questions.length ? <div className="finder-panel"><div className="finder-progress"><span>{t.finderPage.question} {step + 1} {t.finderPage.of} {questions.length}</span><div role="progressbar" aria-label={t.finderPage.progress} aria-valuemin="1" aria-valuemax={questions.length} aria-valuenow={step + 1} aria-valuetext={`${t.finderPage.question} ${step + 1} ${t.finderPage.of} ${questions.length}`}><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div></div><h2>{question.title}</h2><p>{question.hint}</p><div className="finder-options">{question.options.map((option) => { const Icon = option.icon; return <button key={option.value} onClick={() => choose(option.value)}><Icon /><span>{option.label}</span><ArrowRight /></button> })}</div>{step > 0 && <button className="back-link" onClick={() => setStep(step - 1)}><ArrowLeft /> {t.finderPage.previous}</button>}</div> : <div className="finder-results">{answers.priority === 'local' && <LocationPicker compact labels={t.distance} />}<div className="finder-summary"><BadgeCheck /><div><strong>{t.finderPage.suggestions}</strong><span>{t.finderPage.need}: {categories.find((item) => item.id === answers.need)?.[language === 'es' ? 'labelEs' : 'label']} · {t.finderPage.priority}: {t.finderPage.priorities[answers.priority]}</span></div><button onClick={reset}>{t.finderPage.startOver}</button></div>{results.length ? <div className="related-grid">{results.map((item) => <ResourceCard key={item.id} resource={item} compact />)}</div> : <div className="empty-state"><Compass /><h2>{t.finderPage.broaden}</h2><p>{t.finderPage.broadenIntro}</p><Link className="button button--primary" to="/resources">{t.finderPage.browse}</Link></div>}<div className="finder-actions"><button className="button button--secondary" onClick={() => window.print()}><Printer /> {t.finderPage.print}</button><button className="button button--primary" onClick={() => navigate(`/resources?category=${answers.need}`)}>{t.finderPage.every} <ArrowRight /></button></div></div>}
        <aside className="privacy-note"><ShieldCheck /><div><strong>{t.finderPage.private}</strong><p>{t.finderPage.privateIntro}</p></div></aside>
      </section>
    </>
  )
}

function EventsPage() {
  const [filter, setFilter] = useState('All')
  const { allEvents, currentUser, removePostedEvent, reportEvent, setToast, eventsNotice, language, t } = useContext(AppContext)
  const [feed, setFeed] = useState(currentUser?.personalized && currentUser.interests?.length ? 'For you' : 'All events')
  const [params] = useSearchParams()
  useEffect(() => {
    if (params.get('posted') === '1') setToast(t.eventsPage.postedToast)
  }, [params, setToast, t.eventsPage.postedToast])
  const upcoming = useMemo(() => upcomingEvents(allEvents), [allEvents])
  const rankedEvents = feed === 'For you' ? rankEventsForUser(upcoming, currentUser?.interests) : [...upcoming].sort((a, b) => a.date.localeCompare(b.date))
  const { origin } = useContext(DistanceContext)
  const [nearestFirst, setNearestFirst] = useState(false)
  const categoryFiltered = filter === 'All' ? rankedEvents : rankedEvents.filter((event) => event.category === filter)
  const filtered = arrangeByDistance(categoryFiltered, origin, { sort: nearestFirst })
  const downloadCalendar = (eventItem) => {
    const ics = buildIcs(eventItem)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    link.download = `${eventItem.id}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return (
    <>
      <PageHero eyebrow={t.eventsPage.eyebrow} title={t.eventsPage.title} intro={t.eventsPage.intro} compact>
        <div className="hero-actions"><Link className="button button--primary" to="/events/new"><Plus /> {t.eventsPage.post}</Link><Link className="button button--secondary" to="/events/plan"><Sparkles /> {t.eventsPage.plan}</Link>{!currentUser && <Link className="button button--secondary" to="/login?returnTo=/events">{t.eventsPage.signIn}</Link>}</div>
      </PageHero>
      <section className="section events-page">
        {currentUser ? (
          <section className="recommendation-bar" aria-labelledby="recommendation-title">
            <span className="recommendation-icon"><Sparkles /></span>
            <div><span className="eyebrow">{t.eventsPage.yourCalendar}</span><h2 id="recommendation-title">{currentUser.personalized ? t.eventsPage.picked.replace('{name}', currentUser.name.split(' ')[0]) : t.eventsPage.paused}</h2><p>{currentUser.personalized ? (currentUser.interests?.length ? t.eventsPage.matching.replace('{interests}', currentUser.interests.map((interest) => t.eventCategories[interest] || interest).join(', ')) : t.eventsPage.chooseInterests) : t.eventsPage.chronological}</p></div>
            <Link className="text-link" to="/account"><Settings2 /> {t.eventsPage.edit}</Link>
          </section>
        ) : (
          <section className="recommendation-bar recommendation-bar--guest" aria-labelledby="recommendation-title">
            <span className="recommendation-icon"><Sparkles /></span><div><span className="eyebrow">{t.eventsPage.makeYours}</span><h2 id="recommendation-title">{t.eventsPage.discover}</h2><p>{t.eventsPage.discoverIntro}</p></div><Link className="button button--secondary" to="/login?returnTo=/events">{t.eventsPage.create}</Link>
          </section>
        )}
        <div className="distance-bar distance-bar--events"><LocationPicker compact labels={t.distance} /><DistanceOptions sort={nearestFirst} onSort={setNearestFirst} showWithin={false} defaultLabel={feed === 'For you' ? t.eventsPage.best : t.eventsPage.soonest} labels={t.distance} /></div>
        <div className="event-controls">
          {currentUser?.personalized && currentUser?.interests?.length > 0 && <div className="feed-tabs" aria-label={t.eventsPage.chooseFeed}>{['For you', 'All events'].map((item) => <button key={item} className={feed === item ? 'is-active' : ''} onClick={() => setFeed(item)} aria-pressed={feed === item}>{item === 'For you' ? t.eventsPage.forYou : t.eventsPage.allEvents}</button>)}</div>}
          <div className="filter-pills" aria-label={t.eventsPage.filter}>{['All', ...new Set(upcoming.map((event) => event.category))].map((item) => <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item === 'All' ? t.eventsPage.all : t.eventCategories[item] || item}</button>)}</div>
        </div>
        <div className="event-list">{filtered.map((event) => {
          const date = new Date(`${event.date}T12:00:00`)
          const reason = feed === 'For you' && currentUser?.interests?.includes(event.category)
            ? (language === 'es' ? t.eventsPage.because.replace('{category}', (t.eventCategories[event.category] || event.category).toLowerCase()) : getRecommendationReason(event, currentUser.interests))
            : ''
          return <article key={event.id} className="event-card"><time dateTime={event.date}><strong>{date.toLocaleDateString(language, { month: 'short' })}</strong><span>{date.getDate()}</span><small>{date.toLocaleDateString(language, { weekday: 'short' })}</small></time><div><div className="event-labels"><span className="event-category">{t.eventCategories[event.category] || event.category}</span>{event.communitySubmitted && <span className="community-badge"><Users /> {t.eventsPage.submitted}</span>}{reason && <span className="match-reason"><Sparkles /> {reason}</span>}</div><h2>{event.title}</h2><p>{language === 'es' && event.descriptionEs ? event.descriptionEs : event.description}</p><div className="event-facts"><span><Clock3 /> {event.time}</span><span><MapPin /> {event.location}</span><DistanceTag item={event} labels={t.distance} /><span><Accessibility /> {language === 'es' && event.accessibilityEs ? event.accessibilityEs : event.accessibility}</span></div>{isHidden(event) && <p className="hidden-notice" role="status"><EyeOff aria-hidden="true" /> {t.eventsPage.hiddenNotice}</p>}{event.communitySubmitted && <small className="submitted-by">{t.eventsPage.postedBy.replace('{organizer}', event.organizer)}</small>}</div><div className="event-actions"><button className="button button--secondary" onClick={() => downloadCalendar(event)}><CalendarDays /> {t.eventsPage.addCalendar}</button><DirectionsLink item={event} className="text-link" labels={t.distance} />{event.sourceUrl && <a className="text-link" href={event.sourceUrl} target="_blank" rel="noreferrer">{event.communitySubmitted ? t.eventsPage.eventLink : t.eventsPage.official} <ExternalLink /></a>}<ReportControl event={event} />{currentUser && event.communitySubmitted && event.organizerId === currentUser.id && <button className="text-button text-button--danger" onClick={() => removePostedEvent(event.id)}><Trash2 /> {t.eventsPage.remove}</button>}</div></article>
        })}</div>
        {!filtered.length && <div className="empty-state"><CalendarDays /><h2>{t.eventsPage.empty}</h2><p>{t.eventsPage.emptyIntro}</p></div>}
        {eventsNotice && <p className="freshness-note" role="status"><CircleAlert /> {eventsNotice}</p>}
        <p className="freshness-note"><Info /> {t.eventsPage.note}</p>
      </section>
    </>
  )
}

function InterestPicker({ selected, onChange }) {
  const { t } = useContext(AppContext)
  const toggle = (interest) => onChange(selected.includes(interest) ? selected.filter((item) => item !== interest) : [...selected, interest])
  return <fieldset className="interest-picker"><legend>{t.auth.interestsLegend}</legend><p>{t.auth.interestsHint}</p><div>{eventInterests.map((interest) => <label key={interest} className={selected.includes(interest) ? 'is-selected' : ''}><input type="checkbox" checked={selected.includes(interest)} onChange={() => toggle(interest)} /><span>{interest}</span><Check /></label>)}</div></fieldset>
}

function LoginPage() {
  const { currentUser, authStatus, login, register, t } = useContext(AppContext)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState(params.get('mode') === 'signin' ? 'signin' : 'create')
  const [form, setForm] = useState({ name: '', email: '', password: '', interests: ['Family', 'Festival'] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const rawReturnTo = params.get('returnTo') || '/events'
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/events'

  useEffect(() => { if (currentUser) navigate(returnTo, { replace: true }) }, [currentUser, navigate, returnTo])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) return setError(t.auth.shortPassword)
    if (mode === 'create' && form.interests.length === 0) return setError(t.auth.noInterests)
    setBusy(true)
    const result = mode === 'create' ? await register(form) : await login(form)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    navigate(returnTo, { replace: true })
  }

  return <section className="section auth-shell"><div className="auth-intro"><span className="feature-icon"><Sparkles /></span><span className="eyebrow">{t.auth.eyebrow}</span><h1>{t.auth.title}</h1><p>{t.auth.intro}</p><ul>{t.auth.points.map((point) => <li key={point}><Check /> {point}</li>)}</ul></div><form className="auth-form" onSubmit={submit}><div className="auth-tabs" role="tablist" aria-label={t.auth.tabs}><button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => { setMode('signin'); setError('') }}>{t.auth.signIn}</button><button type="button" role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'is-active' : ''} onClick={() => { setMode('create'); setError('') }}>{t.auth.create}</button></div><div className="auth-form__heading"><h2>{mode === 'create' ? t.auth.createHeading : t.auth.signInHeading}</h2><p>{mode === 'create' ? t.auth.createIntro : t.auth.signInIntro}</p></div>{mode === 'create' && <label>{t.auth.name}<span className="input-wrap"><UserRound /><input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t.auth.namePlaceholder} /></span></label>}<label>{t.auth.email}<span className="input-wrap"><Mail /><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></span></label><label>{t.auth.password}<span className="input-wrap"><LockKeyhole /><input required minLength="8" type="password" autoComplete={mode === 'create' ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={t.auth.passwordPlaceholder} /></span></label>{mode === 'create' && <InterestPicker selected={form.interests} onChange={(interests) => setForm({ ...form, interests })} />}{error && <p className="form-error" role="alert"><CircleAlert /> {error}</p>}<button className="button button--primary button--wide" disabled={busy || authStatus === 'unavailable'}>{busy ? t.auth.wait : mode === 'create' ? t.auth.create : t.auth.signIn} <ArrowRight /></button>{authStatus === 'unavailable' ? <p className="local-data-note" role="status"><CircleAlert /> {t.auth.unavailable}</p> : <p className="local-data-note"><ShieldCheck /> {t.auth.privacy}</p>}</form></section>
}

function AccountPage() {
  const { currentUser, signOut, updateProfile, t } = useContext(AppContext)
  const navigate = useNavigate()
  const [interests, setInterests] = useState(currentUser?.interests || [])
  const [personalized, setPersonalized] = useState(currentUser?.personalized ?? true)
  const [busy, setBusy] = useState(false)
  // The profile arrives from the backend a moment after the session does, so the
  // form mirrors it once it lands instead of staying stuck on empty defaults.
  useEffect(() => {
    if (!currentUser) return
    setInterests(currentUser.interests)
    setPersonalized(currentUser.personalized)
  }, [currentUser?.id, currentUser?.interests?.join('|'), currentUser?.personalized])
  if (!currentUser) return <SignInRequired title={t.account.signInTitle} intro={t.account.signInIntro} returnTo="/account" labels={t.signInRequired} />
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    await updateProfile({ interests, personalized })
    setBusy(false)
  }
  const logout = async () => { await signOut(); navigate('/events') }
  return <><PageHero eyebrow={t.account.eyebrow} title={`${t.account.hello}, ${currentUser.name.split(' ')[0]}`} intro={t.account.intro} compact /><section className="section account-layout"><form className="profile-panel" onSubmit={save}><div className="profile-identity"><span><UserRound /></span><div><h2>{currentUser.name}</h2><p>{currentUser.email}</p></div></div><label className="personalization-switch"><span><strong>{t.account.personalizedTitle}</strong><small>{t.account.personalizedHint}</small></span><input type="checkbox" checked={personalized} onChange={(event) => setPersonalized(event.target.checked)} /></label><InterestPicker selected={interests} onChange={setInterests} /><div className="form-actions"><button className="button button--primary" disabled={busy}>{busy ? t.account.saving : t.account.save}</button><button type="button" className="button button--secondary" onClick={logout}><LogOut /> {t.account.signOut}</button></div></form><aside className="account-aside"><Sparkles /><h2>{t.account.howTitle}</h2><p>{SITE_NAME} {t.account.howBody}</p><p>{t.account.howPrivacy}</p><Link className="text-link" to="/events">{t.account.feedLink} <ArrowRight /></Link></aside></section></>
}

function SignInRequired({ title, intro, returnTo, labels }) {
  const text = labels || copy.en.signInRequired
  return <section className="section sign-in-required"><span className="feature-icon"><LockKeyhole /></span><span className="eyebrow">{text.eyebrow}</span><h1>{title}</h1><p>{intro}</p><div><Link className="button button--primary" to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>{text.action} <ArrowRight /></Link><Link className="button button--secondary" to="/events">{text.back}</Link></div></section>
}

function PostEventPage() {
  const { currentUser, addPostedEvent, language, t } = useContext(AppContext)
  const navigate = useNavigate()
  const statePrefill = useLocation().state?.prefill
  const [prefill] = useState(() => {
    if (statePrefill) return statePrefill
    try { return JSON.parse(sessionStorage.getItem(PLAN_DRAFT_KEY) || 'null') } catch { return null }
  })
  const today = todayISO()
  const [form, setForm] = useState({ title: prefill?.title || '', date: '', startTime: '', endTime: '', location: '', category: eventInterests.includes(prefill?.category) ? prefill.category : 'Family', description: prefill?.description || '', accessibility: '', sourceUrl: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [paste, setPaste] = useState('')
  const [reading, setReading] = useState(false)
  const [readResult, setReadResult] = useState(null)

  /**
   * Fills the form from a pasted flyer or email. Every field stays editable,
   * and nothing is posted until the resident submits it themselves.
   */
  const fillFromPaste = async () => {
    if (!paste.trim()) return
    setReading(true)
    setReadResult(null)
    const result = await extractEventFields(paste)
    setReading(false)
    if (!result?.fields) return setReadResult({ ok: false })
    const { form: next, filled, missing } = applyExtractedFields(form, result.fields, today)
    setForm(next)
    setReadResult({ ok: true, filled, missing })
  }

  /* Once a signed-in resident has the draft in the form, it has done its job. */
  useEffect(() => {
    if (currentUser) { try { sessionStorage.removeItem(PLAN_DRAFT_KEY) } catch { /* storage can be unavailable */ } }
  }, [currentUser?.id])
  if (!currentUser) return <SignInRequired title={t.postEvent.signInTitle} intro={t.postEvent.signInIntro} returnTo="/events/new" labels={t.signInRequired} />
  const fromPlan = Boolean(prefill?.title || prefill?.description)
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const formatTime = (value) => new Date(`2000-01-01T${value}`).toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit' })
    setBusy(true)
    const result = await addPostedEvent({ title: form.title.trim(), date: form.date, time: `${formatTime(form.startTime)}${form.endTime ? `-${formatTime(form.endTime)}` : ''}`, location: form.location.trim(), category: form.category, description: form.description.trim(), accessibility: form.accessibility.trim() || t.postEvent.accessibilityDefault, sourceUrl: form.sourceUrl.trim() })
    setBusy(false)
    if (!result.ok) return setError(result.error)
    navigate('/events?posted=1')
  }
  const fieldNames = (fields) => fields.map((field) => t.postEvent.fields[field] || field).join(', ')
  return <><PageHero eyebrow={t.postEvent.eyebrow} title={t.postEvent.title} intro={t.postEvent.intro} compact /><section className="section post-event-layout"><form className="event-form" onSubmit={submit}><div className="flyer-paste"><h2>{t.postEvent.flyerTitle}</h2><p>{t.postEvent.flyerIntro}</p><textarea rows="3" maxLength={2000} value={paste} onChange={(event) => setPaste(event.target.value)} placeholder={t.postEvent.flyerPlaceholder} aria-label={t.postEvent.flyerLabel} /><div className="flyer-paste__actions"><button type="button" className="button button--secondary" onClick={fillFromPaste} disabled={reading || !paste.trim()}><Sparkles /> {reading ? t.postEvent.reading : t.postEvent.fill}</button>{paste && <button type="button" className="text-button" onClick={() => { setPaste(''); setReadResult(null) }}>{t.postEvent.clear}</button>}</div>{readResult && (readResult.ok
  ? <p className="flyer-paste__result" role="status">{readResult.filled.length ? t.postEvent.filled.replace('{fields}', fieldNames(readResult.filled)) : t.postEvent.nothingFilled}{readResult.missing.length ? t.postEvent.stillNeeded.replace('{fields}', fieldNames(readResult.missing)) : ''}</p>
  : <p className="flyer-paste__result flyer-paste__result--error" role="alert">{t.postEvent.readError}</p>)}</div>{fromPlan && <p className="prefill-note" role="status"><Sparkles /> {t.postEvent.fromPlan}</p>}<div className="form-section"><span>01</span><div><h2>{t.postEvent.basics}</h2><p>{t.postEvent.basicsIntro}</p><label>{t.postEvent.eventTitle}<input required maxLength="80" value={form.title} onChange={update('title')} placeholder={t.postEvent.titlePlaceholder} /></label><label>{t.postEvent.category}<select value={form.category} onChange={update('category')}>{eventInterests.map((interest) => <option key={interest} value={interest}>{t.eventCategories[interest] || interest}</option>)}</select></label><label>{t.postEvent.description}<textarea required maxLength="400" rows="5" value={form.description} onChange={update('description')} placeholder={t.postEvent.descriptionPlaceholder} /><small>{form.description.length}/400</small></label></div></div><div className="form-section"><span>02</span><div><h2>{t.postEvent.whenWhere}</h2><div className="form-row"><label>{t.postEvent.date}<input required min={today} type="date" value={form.date} onChange={update('date')} /></label><label>{t.postEvent.starts}<input required type="time" value={form.startTime} onChange={update('startTime')} /></label><label>{t.postEvent.ends}<input type="time" value={form.endTime} min={form.startTime} onChange={update('endTime')} /></label></div><label>{t.postEvent.location}<input required maxLength="120" value={form.location} onChange={update('location')} placeholder={t.postEvent.locationPlaceholder} /></label></div></div><div className="form-section"><span>03</span><div><h2>{t.postEvent.planning}</h2><label>{t.postEvent.accessibility}<textarea rows="3" maxLength="220" value={form.accessibility} onChange={update('accessibility')} placeholder={t.postEvent.accessibilityPlaceholder} /></label><label>{t.postEvent.website}<input type="url" value={form.sourceUrl} onChange={update('sourceUrl')} placeholder="https://example.org/event" /></label></div></div><div className="submission-check"><ShieldCheck /><div><strong>{t.postEvent.submitted}</strong><p>{t.postEvent.submittedIntro}</p></div></div>{error && <p className="form-error" role="alert"><CircleAlert /> {error}</p>}<div className="form-actions form-actions--end"><Link className="button button--secondary" to="/events">{t.postEvent.cancel}</Link><button className="button button--primary" disabled={busy}><Send /> {busy ? t.postEvent.publishing : t.postEvent.publish}</button></div></form><aside className="posting-guide"><h2>{t.postEvent.before}</h2><ol><li><span>1</span><p><strong>{t.postEvent.checkTitle}</strong> {t.postEvent.check}</p></li><li><span>2</span><p><strong>{t.postEvent.inclusiveTitle}</strong> {t.postEvent.inclusive}</p></li><li><span>3</span><p><strong>{t.postEvent.localTitle}</strong> {t.postEvent.local}</p></li></ol><p className="local-data-note"><Info /> {t.postEvent.publicNote}</p></aside></section></>
}

function SavedPage() {
  const { saved, toggleSaved, language, t } = useContext(AppContext)
  const savedResources = resources.filter((resource) => saved.includes(resource.id))
  return (
    <>
      <PageHero eyebrow={t.savedPlan.eyebrow} title={t.savedPlan.title} intro={t.savedPlan.intro} compact />
      <section className="section saved-page">
        {savedResources.length ? <><div className="plan-toolbar"><span><Bookmark /> {savedResources.length === 1 ? t.savedPlan.one : t.savedPlan.many.replace('{count}', savedResources.length)}</span><button className="button button--secondary" onClick={() => window.print()}><Printer /> {t.savedPlan.print}</button></div><ol className="action-plan">{savedResources.map((resource, index) => <li key={resource.id}><span className="action-plan__number">{String(index + 1).padStart(2, '0')}</span><div><h2><Link to={`/resources/${resource.id}`}>{resource.name}</Link></h2><p>{language === 'es' ? resource.descriptionEs : resource.description}</p><div className="resource-meta"><span><Phone /> {resource.phone}</span><span><Clock3 /> {resource.hours}</span><DistanceTag item={resource} labels={t.distance} /></div></div><div className="action-plan__actions"><a className="button button--primary" href={`tel:${resource.phone.replace(/[^\d]/g, '')}`}>{t.savedPlan.call}</a><DirectionsLink item={resource} className="text-button" labels={t.distance} /><button className="text-button" onClick={() => toggleSaved(resource.id)}>{t.savedPlan.remove}</button></div></li>)}</ol></> : <div className="empty-state empty-state--large"><Bookmark /><h2>{t.savedPlan.emptyTitle}</h2><p>{t.savedPlan.emptyIntro}</p><div><Link className="button button--primary" to="/resources">{t.savedPlan.explore}</Link><Link className="button button--secondary" to="/finder">{t.savedPlan.finder}</Link></div></div>}
      </section>
    </>
  )
}

function UrgentPage() {
  const { language, t } = useContext(AppContext)
  return (
    <>
      <PageHero eyebrow={t.urgentPage.eyebrow} title={t.urgentPage.title} intro={t.urgentPage.intro} compact danger />
      <section className="section urgent-page"><div className="urgent-list">{urgentLinks.map((item) => <a key={item.label} href={`tel:${item.phone}`}><span><Phone /></span><div><strong>{language === 'es' ? item.labelEs : item.label}</strong><small>{language === 'es' ? item.detailEs : item.detail}</small></div><ArrowRight /></a>)}</div><article className="safety-note"><ShieldCheck /><div><h2>{t.urgentPage.safetyTitle}</h2><p>{t.urgentPage.safetyBody}</p><a href="https://turningpointnc.org/" target="_blank" rel="noreferrer">{t.urgentPage.safetyLink} <ExternalLink /></a></div></article><div className="urgent-disclaimer"><Info /><p><strong>{t.urgentPage.disclaimerLead}</strong> {t.urgentPage.disclaimerBody}</p></div></section>
    </>
  )
}

function AboutPage() {
  const { language, t } = useContext(AppContext)
  return (
    <>
      <PageHero eyebrow={`${t.aboutPage.eyebrow} ${SITE_NAME}`} title={t.aboutPage.title} intro={t.aboutPage.intro} compact />
      <section className="section about-layout"><article><h2>{t.aboutPage.purposeTitle}</h2><p>{SITE_NAME} {t.aboutPage.purposeBody}</p><h2>{t.aboutPage.methodTitle}</h2><ol className="method-list">{t.aboutPage.steps.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol><h2 id="sources">{t.aboutPage.sourcesTitle}</h2><div className="source-list">{sourceNotes.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer"><span><strong>{source.name}</strong><small>{source.role}</small></span><ExternalLink /></a>)}</div></article><aside className="about-aside"><span className="feature-icon"><Accessibility /></span><h2>{t.aboutPage.asideTitle}</h2><p>{t.aboutPage.asideBody}</p><h3>{t.aboutPage.watchTitle}</h3><ul>{t.aboutPage.watch.map((item) => <li key={item}>{item}</li>)}</ul><a className="text-link" href="#metrics-heading">{t.aboutMetrics.link} <ArrowRight size={16} /></a><span className="review-stamp"><BadgeCheck /> {t.verificationReviewed} {formatVerificationDate(latestVerificationDate, language)}</span></aside></section><section className="section"><MetricsPanel copy={t.aboutMetrics} /></section>
    </>
  )
}

/**
 * Reporting is deliberately friction-light but not accidental: one tap opens a
 * confirmation that says what a report does, and the control explains itself
 * when it cannot be used rather than disappearing.
 */
function ReportControl({ event }) {
  const { currentUser, reportEvent, t } = useContext(AppContext)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const viewerId = currentUser?.id
  const blocked = reportBlockedReason(event, viewerId)
  if (blocked === 'official' || blocked === 'own') return null
  if (blocked === 'already') return <span className="report-done"><Flag aria-hidden="true" /> {t.eventsPage.reported}</span>
  if (blocked === 'signedOut') {
    return <Link className="text-button" to={`/login?returnTo=${encodeURIComponent('/events')}`}><Flag /> {t.eventsPage.reportSignIn}</Link>
  }

  const send = async () => {
    setBusy(true)
    await reportEvent(event.id)
    setBusy(false)
    setConfirming(false)
  }

  if (!confirming) {
    return <button type="button" className="text-button" onClick={() => setConfirming(true)}><Flag /> {t.eventsPage.report}</button>
  }
  return (
    <span className="report-confirm" role="group" aria-label={t.eventsPage.reportTitle}>
      <span>{t.eventsPage.reportAsk}</span>
      <button type="button" className="text-button text-button--danger" onClick={send} disabled={busy}>{busy ? t.eventsPage.reporting : t.eventsPage.reportYes}</button>
      <button type="button" className="text-button" onClick={() => setConfirming(false)}>{t.eventsPage.reportNo}</button>
    </span>
  )
}

function CompareTray() {
  const { origin } = useContext(DistanceContext)
  const { compare, toggleCompare } = useContext(AppContext)
  const [expanded, setExpanded] = useState(false)
  if (!compare.length) return null
  const items = resources.filter((resource) => compare.includes(resource.id))
  return (
    <aside className={`compare-tray ${expanded ? 'compare-tray--expanded' : ''}`} aria-label="Compare resources">
      <div className="compare-tray__bar"><button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><span><Filter /> Compare resources</span><strong>{items.length} of 3 selected</strong><ChevronDown /></button></div>
      {expanded && <div className="compare-table"><div className="compare-table__intro"><h2>Compare your options</h2><p>Review practical details side by side.</p></div>{items.map((item) => <article key={item.id}><button className="icon-button" onClick={() => toggleCompare(item.id)} aria-label={`Remove ${item.name} from comparison`}><X /></button><h3>{item.name}</h3><dl><dt>Cost</dt><dd>{item.cost}</dd><dt>Hours</dt><dd>{item.hours}</dd><dt>Who it serves</dt><dd>{item.audiences.join(', ')}</dd><dt>Location</dt><dd>{item.location}</dd>{origin && <><dt>Distance</dt><dd>{describeDistance(origin, placeFor(item))?.text || 'No fixed location'}</dd></>}</dl><Link className="text-link" to={`/resources/${item.id}`}>View details <ArrowRight /></Link></article>)}</div>}
    </aside>
  )
}


function NotFoundPage() {
  return <section className="section not-found"><Compass /><span className="eyebrow">404</span><h1>This path doesn’t lead to a resource</h1><p>The page may have moved. Start from the directory or let the guided finder point you in the right direction.</p><div><Link className="button button--primary" to="/resources">Browse resources</Link><Link className="button button--secondary" to="/finder">Use guided finder</Link></div></section>
}

function Footer() {
  const { t } = useContext(AppContext)
  return (
    <footer><div className="footer-main"><BrandMark compact /><p>{t.footer.intro}</p><div className="footer-links"><div><strong>{t.footer.findSupport}</strong><Link to="/resources">{t.footer.resourceDirectory}</Link><Link to="/finder">{t.footer.guidedFinder}</Link><Link to="/urgent">{t.footer.urgentHelp}</Link></div><div><strong>{t.footer.community}</strong><Link to="/events">{t.footer.events}</Link><Link to="/saved">{t.footer.savedPlan}</Link><Link to="/about">{t.footer.sourcesMethod}</Link></div><div><strong>{t.footer.alwaysAvailable}</strong><a href="tel:211">{t.footer.call211}</a><a href="tel:988">{t.footer.call988}</a><a href="tel:911">{t.footer.emergency}</a></div></div></div><div className="footer-bottom"><span>{SITE_NAME} {t.footer.project}</span><span><Leaf /> {t.footer.tagline}</span></div></footer>
  )
}

export default App
