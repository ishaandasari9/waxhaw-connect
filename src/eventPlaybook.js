/**
 * Events elsewhere in the region that worked, researched and checked by hand.
 *
 * The event planner picks from this list instead of searching the web. That
 * means it cannot invent an event, a town or an attendance figure: the AI only
 * chooses which of these to show, and every word a resident reads here was
 * written from the source linked beside it.
 *
 * `tags` are what the AI matches against a resident's idea. `why` is the part
 * a first-time organizer can actually copy.
 *
 * Checked September 19, 2026.
 */
export const eventPlaybook = [
  {
    id: 'matthews-alive',
    name: 'Matthews Alive',
    place: 'Matthews, Mecklenburg County',
    tags: ['festival', 'parade', 'fundraiser', 'family', 'music', 'vendors', 'large'],
    why: [
      'Run by a volunteer nonprofit board that works year-round, not by one organizer in the final month.',
      'Admission is free and the money comes from carnival tickets, vendors and sponsors instead of the gate.',
      'Proceeds go back to local nonprofits, which gives dozens of groups a reason to staff it.',
      'It anchors to Labor Day weekend every year, so residents already know when it happens.',
    ],
    whyEs: [
      'La organiza una junta de voluntarios sin fines de lucro que trabaja todo el año, no una sola persona en el último mes.',
      'La entrada es gratuita y el dinero viene de la feria, los vendedores y los patrocinadores, no de la taquilla.',
      'Las ganancias vuelven a organizaciones locales, lo que da a decenas de grupos una razón para ayudar.',
      'Siempre cae en el fin de semana del Día del Trabajo, así que los residentes ya saben cuándo es.',
    ],
    source: { label: 'matthewsalive.org', url: 'https://matthewsalive.org/about/' },
  },
  {
    id: 'davidson-farmers-market',
    name: 'Davidson Farmers Market',
    place: 'Davidson, Mecklenburg County',
    tags: ['market', 'vendors', 'recurring', 'food', 'small business', 'family'],
    why: [
      'Producer-only rules: every seller grew or made what they sell, within 100 miles, which gives shoppers a reason to choose it.',
      'It sits on Main Street beside the town hall, so it collects people already walking downtown.',
      'A music stage and a small play area turn a shopping trip into a morning out, and families stay longer.',
      'It runs rain or shine on the same morning every week, so nobody has to check whether it is on.',
    ],
    whyEs: [
      'Solo vende quien produce: cada vendedor cultivó o elaboró su producto a menos de 100 millas, lo que da una razón para elegirlo.',
      'Está en la calle principal, junto al ayuntamiento, así que aprovecha a la gente que ya camina por el centro.',
      'Un escenario con música y un área de juegos convierten las compras en una mañana en familia, y la gente se queda más tiempo.',
      'Abre llueva o truene, el mismo día cada semana, así que nadie tiene que averiguar si habrá mercado.',
    ],
    source: { label: 'davidsonfarmersmarket.org', url: 'https://www.davidsonfarmersmarket.org/about' },
  },
  {
    id: 'mint-hill-events',
    name: 'Mint Hill Madness and the town event series',
    place: 'Mint Hill, Mecklenburg County',
    tags: ['festival', 'music', 'recurring', 'family', 'partnership', 'small budget'],
    why: [
      'One nonprofit runs a whole calendar rather than a single festival, so volunteers and sponsors stay involved all year.',
      'Free evening concerts pair a band with food trucks and lawn games, which costs little and still fills a park.',
      'Events repeat in the same parks, so residents learn where to go without checking a map.',
    ],
    whyEs: [
      'Una sola organización maneja todo un calendario en vez de un solo festival, así los voluntarios y patrocinadores siguen involucrados todo el año.',
      'Los conciertos gratuitos combinan una banda con food trucks y juegos en el césped, lo que cuesta poco y aun así llena un parque.',
      'Los eventos se repiten en los mismos parques, así los residentes aprenden a dónde ir sin buscar un mapa.',
    ],
    source: { label: 'thecharlotteweekly.com', url: 'https://www.thecharlotteweekly.com/mmhweekly/mint-hill-events-announces-2025-schedule/article_3f94bf76-df20-11ef-b6de-3f0ee39a70ed.html' },
  },
  {
    id: 'fetching-fun-festival',
    name: 'Fetching Fun Festival',
    place: 'Mint Hill, Mecklenburg County',
    tags: ['pets', 'family', 'small budget', 'partnership', 'new event'],
    why: [
      'A narrow theme, dogs, gave a brand new event a clear audience instead of competing with the big festivals.',
      'Pairing with a pet adoption event brought a partner organization that promoted it to its own supporters.',
      'The police K9 unit gave families a free reason to come and cost the organizers nothing.',
    ],
    whyEs: [
      'Un tema específico, los perros, le dio a un evento nuevo un público claro en vez de competir con los grandes festivales.',
      'Unirse a un evento de adopción atrajo a una organización aliada que lo promovió entre sus propios seguidores.',
      'La unidad K9 de la policía dio a las familias una razón gratuita para asistir y no costó nada a los organizadores.',
    ],
    source: { label: 'thecharlotteweekly.com', url: 'https://www.thecharlotteweekly.com/mmhweekly/mint-hill-events-announces-2025-schedule/article_3f94bf76-df20-11ef-b6de-3f0ee39a70ed.html' },
  },
  {
    id: 'festival-in-the-park',
    name: 'Festival in the Park',
    place: 'Charlotte, Mecklenburg County',
    tags: ['festival', 'arts', 'music', 'large', 'family', 'vendors'],
    why: [
      'More than sixty years in the same park has made the location part of the event’s name and identity.',
      'Several stages spread the crowd out, so a big turnout never feels like one long queue.',
      'A separate family zone keeps younger children busy while the rest of a group browses artists.',
    ],
    whyEs: [
      'Más de sesenta años en el mismo parque han hecho que el lugar sea parte del nombre y la identidad del evento.',
      'Varios escenarios reparten a la multitud, así que una gran asistencia nunca se siente como una sola fila.',
      'Una zona familiar aparte mantiene ocupados a los niños pequeños mientras el resto del grupo recorre a los artistas.',
    ],
    source: { label: 'thecharlotteweekly.com', url: 'https://www.thecharlotteweekly.com/southcltweekly/8-can-t-miss-fall-festivals-in-mecklenburg-union-counties/article_babf2e87-5c05-422b-9b14-cb1fd086841a.html' },
  },
  {
    id: 'fall-festival-spacing',
    name: 'The Mecklenburg and Union fall festival calendar',
    place: 'Union and Mecklenburg Counties',
    tags: ['festival', 'timing', 'partnership', 'large', 'new event'],
    why: [
      'Neighboring towns deliberately spread their fall festivals across different weekends instead of competing on the same day.',
      'Because they do not overlap, the same food trucks, craft vendors and performers can work several of them.',
      'Checking what nearby towns have already booked is the cheapest scheduling decision an organizer can make.',
    ],
    whyEs: [
      'Los pueblos vecinos reparten a propósito sus festivales de otoño en fines de semana distintos en vez de competir el mismo día.',
      'Como no se traslapan, los mismos food trucks, artesanos y artistas pueden trabajar en varios de ellos.',
      'Revisar qué han reservado ya los pueblos cercanos es la decisión de calendario más barata que puede tomar un organizador.',
    ],
    source: { label: 'thecharlotteweekly.com', url: 'https://www.thecharlotteweekly.com/southcltweekly/8-can-t-miss-fall-festivals-in-mecklenburg-union-counties/article_babf2e87-5c05-422b-9b14-cb1fd086841a.html' },
  },
]

export const playbookIds = eventPlaybook.map((entry) => entry.id)

export function playbookEntry(id) {
  return eventPlaybook.find((entry) => entry.id === id) || null
}
