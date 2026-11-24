import type { Messages } from '../types.ts'
import { plural } from './grammar.ts'

export const calendars: Messages['calendars'] = {
  personalName: 'Osobisty',
  roles: {
    owner: 'Właściciel',
    admin: 'Administrator',
    manager: 'Menedżer',
    editor: 'Redaktor',
    member: 'Członek',
    contributor: 'Współtwórca',
    viewer: 'Obserwator',
  },
  roleDescriptions: {
    owner: 'Prowadzi kalendarz i zawsze ma wszystkie uprawnienia.',
    admin: 'Zarządza kalendarzami, członkami i wszystkimi wydarzeniami. Nie może usunąć kalendarza.',
    manager: 'Zarządza kalendarzem i wszystkimi wydarzeniami oraz zaprasza nowych członków.',
    editor: 'Tworzy wydarzenia oraz edytuje i usuwa wszystkie wydarzenia.',
    member: 'Tworzy wydarzenia oraz edytuje i usuwa własne.',
    contributor: 'Tworzy wydarzenia i edytuje własne, ale niczego nie usuwa.',
    viewer: 'Widzi kalendarz, ale niczego nie zmienia.',
  },
  roleOverview: 'Co może każda rola',
  roleHint: (role, description) => `${role}: ${description}`,
  kind: {
    personal: 'Kalendarz osobisty',
    team: 'Kalendarz zespołu',
    teamWithName: (team) => `Kalendarz zespołu · ${team}`,
  },
  indicator: {
    onlyYou: 'Tylko dla Ciebie',
    team: (role) => `Zespół · ${role}`,
    current: (name) => `Bieżący kalendarz: ${name}`,
  },
  switcher: {
    open: 'Zmień kalendarz',
    title: 'Zmień kalendarz',
    personal: 'Osobisty',
    teams: 'Zespoły',
    active: 'Aktywny',
    openInvitations: (count) =>
      count === 1
        ? 'Masz jedno oczekujące zaproszenie.'
        : `Masz ${count} ${plural(count, 'oczekujące zaproszenie', 'oczekujące zaproszenia', 'oczekujących zaproszeń')}.`,
    view: 'Pokaż',
    noTeams: 'Nie należysz jeszcze do żadnego zespołu. Utwórz kalendarz lub dołącz do niego przez zaproszenie.',
    newCalendar: 'Nowy kalendarz',
  },
  invitations: {
    title: 'Zaproszenia',
    description:
      'Zaproszono Cię do tych kalendarzy. Po akceptacji znajdziesz je w sekcji Kalendarze i w „Zmień kalendarz”.',
    empty: 'Brak oczekujących zaproszeń. Gdy ktoś zaprosi Cię do kalendarza, zaproszenie pojawi się tutaj.',
    invitedBy: (name) => `${name} zaprasza Cię`,
    invited: 'Masz zaproszenie',
    validUntil: (date) => `ważne do ${date}`,
    decline: 'Odrzuć',
    declining: 'Odrzucanie …',
    accept: 'Akceptuj',
    accepting: 'Akceptowanie …',
  },
  list: {
    title: 'Kalendarze',
    description:
      'Wszystkie kalendarze, do których masz dostęp, wraz z Twoją rolą. W kalendarzach zespołów decydujesz, czy ich wydarzenia pojawiają się też w Twoim kalendarzu osobistym. Możesz je opuścić, chyba że jesteś właścicielem. Wtedy musisz najpierw przekazać własność.',
    settingsFor: (name) => `Ustawienia: ${name}`,
    personalHint: 'Twój własny kalendarz. Nie można go opuścić ani usunąć.',
    showInPersonal: 'Pokazuj wydarzenia także w kalendarzu osobistym',
    leave: 'Opuść kalendarz',
    ownerCannotLeave: 'Jako właściciel możesz opuścić kalendarz dopiero po przekazaniu własności.',
    noTeamCalendars: 'Nie ma jeszcze kalendarzy zespołów. Utwórz kalendarz lub dołącz do niego przez zaproszenie.',
    create: 'Utwórz kalendarz',
  },
  leave: {
    title: 'Opuścić kalendarz?',
    confirm: 'Opuść',
    pending: 'Opuszczanie …',
    message: (team) =>
      `Opuszczasz zespół „${team}” i nie będziesz już widzieć jego kalendarza. Wrócić możesz tylko przez nowe zaproszenie.`,
  },
  create: {
    title: 'Nowy kalendarz',
    steps: [
      { label: 'Nazwa', title: 'Jak nazywa się kalendarz?', hint: 'Wszyscy członkowie widzą nazwę i opis.' },
      { label: 'Kolor', title: 'Jaki ma mieć kolor?', hint: 'Nowe wydarzenia w tym kalendarzu dostają ten kolor.' },
      {
        label: 'Członkowie',
        title: 'Kogo chcesz zaprosić?',
        hint: 'Zaproszone osoby dostaną e-mail i zobaczą kalendarz, gdy tylko zaakceptują.',
      },
      {
        label: 'Podsumowanie',
        title: 'Czy wszystko się zgadza?',
        hint: 'Jesteś właścicielem i możesz wszystko później zmienić.',
      },
    ],
    stepCount: (step, total) => `Krok ${step} z ${total}`,
    next: 'Dalej',
    pending: 'Tworzenie …',
    submit: 'Utwórz kalendarz',
  },
  details: {
    name: 'Nazwa',
    namePlaceholder: 'np. Rodzina, klub piłkarski, projekt',
    description: 'Opis',
    descriptionOptional: 'Opis (opcjonalnie)',
    descriptionPlaceholder: 'Do czego służy ten kalendarz?',
    yourRole: 'Twoja rola',
    invitations: 'Zaproszenia',
    none: 'Brak',
  },
  invite: {
    email: 'Adres e-mail',
    role: 'Rola',
    add: 'Dodaj',
    nobodyYet: 'Nikt nie został jeszcze zaproszony. Możesz to zrobić także później.',
    remove: (email) => `Usuń ${email}`,
  },
  validation: {
    nameRequired: 'Podaj nazwę.',
    nameTooLong: (max) => `Nazwa może mieć maksymalnie ${max} znaków.`,
    tooManyInvitations: (max) => `Maksymalnie ${max} zaproszeń naraz.`,
    selfInvite: 'Automatycznie jesteś właścicielem i nie musisz się zapraszać.',
    alreadyInvited: 'Ten adres został już zaproszony.',
    alreadyMember: 'Ta osoba jest już członkiem.',
  },
  settings: {
    title: 'Ustawienia kalendarza',
    pageTitle: (name) => `${name} · Ustawienia`,
    notFound: 'Ten kalendarz nie istnieje lub nie masz już do niego dostępu.',
    tabsLabel: 'Sekcje ustawień kalendarza',
    withCount: (label, count) => (count > 0 ? `${label} (${count})` : label),
    tabs: {
      general: 'Ogólne',
      members: 'Członkowie',
      invitations: 'Zaproszenia',
      danger: 'Strefa zagrożenia',
      booking: 'Strony rezerwacji',
      sharing: 'Udostępnianie',
      exchange: 'Import i eksport',
      trash: 'Kosz',
    },
    displayTitle: 'Wyświetlanie',
    displayDescription: 'Dotyczy tylko Ciebie. Inni członkowie ustawiają to sami.',
    personalTitle: 'Kalendarz osobisty',
    personalHint:
      'Tylko Ty widzisz ten kalendarz. Nie można go opuścić ani usunąć. Wydarzenia z kalendarzy zespołów pokazujesz lub ukrywasz w ich ustawieniach.',
  },
  general: {
    title: 'Ogólne',
    teamDescription:
      'Właściciele, administratorzy i menedżerowie zmieniają nazwę i kolor. Właściciele i administratorzy zmieniają opis.',
    personalDescription: 'Nazwa i kolor Twojego kalendarza osobistego. Widzisz go tylko Ty.',
    pending: 'Zapisywanie …',
  },
  members: {
    title: 'Członkowie',
    description:
      'Wszyscy, którzy widzą ten kalendarz. Właściciele i administratorzy mogą zmieniać role i usuwać członków, ale tylko z rolami niższymi niż własna.',
    you: ' (Ty)',
    roleOf: (name) => `Rola: ${name}`,
    remove: 'Usuń',
    removeTitle: 'Usunąć członka?',
    removing: 'Usuwanie …',
    removeMessage: (name, calendar) =>
      `${name} nie będzie już widzieć „${calendar}”. Powrót jest możliwy tylko przez nowe zaproszenie.`,
  },
  teamInvitations: {
    title: 'Zaproszenia',
    description:
      'Zapraszaj nowych członków e-mailem. Możesz przydzielać tylko role niższe niż własna. Zaproszenie jest ważne 7 dni.',
    revoke: 'Wycofaj',
    revoking: 'Wycofywanie …',
    submit: 'Zaproś',
    sending: 'Wysyłanie …',
    sent: (email) => `Wysłano zaproszenie do ${email}.`,
    none: 'Brak oczekujących zaproszeń.',
  },
  danger: {
    title: 'Strefa zagrożenia',
    transferHint:
      'Inny członek zostaje właścicielem, a Ty administratorem. Rolę odzyskasz tylko wtedy, gdy nowy właściciel Ci ją przekaże.',
    transferUnavailable:
      'Aby przekazać własność, zespół potrzebuje innego członka, który nie jest jeszcze właścicielem.',
    transfer: 'Przekaż własność',
    lastOwnerHint: 'Jako jedyny właściciel nie możesz odejść. Najpierw przekaż własność lub usuń zespół.',
    leaveHint: 'Nie będziesz już widzieć kalendarza. Wrócić możesz tylko przez nowe zaproszenie.',
    deleteHint: (team) =>
      `Usuwa zespół „${team}” ze wszystkimi kalendarzami, wydarzeniami i zaproszeniami dla wszystkich członków.`,
    deleteTeam: 'Usuń zespół',
    transferConfirmTitle: 'Na pewno przekazać własność?',
    transferConfirm: 'Przekaż na stałe',
    transferring: 'Przekazywanie …',
    transferMessage: (name, email, team, role) =>
      `${name} (${email}) zostaje właścicielem „${team}” i otrzymuje wszystkie uprawnienia, w tym usunięcie zespołu. Ty otrzymujesz rolę ${role} i nie będziesz już mógł usunąć zespołu ani sam odzyskać własności.`,
    deleteTitle: 'Usunąć zespół?',
    deleteConfirm: 'Usuń trwale',
    deleting: 'Usuwanie …',
    deleteMessage: (team, count) =>
      `„${team}” zostanie usunięty ze wszystkimi kalendarzami, wydarzeniami i zaproszeniami, także dla wszystkich członków (${count}). Tej operacji nie można cofnąć.`,
  },
  categories: {
    title: 'Kategorie',
    description: 'Przypisuj wydarzenia z tego kalendarza do kategorii i filtruj według nich widoki.',
    empty: 'Brak kategorii.',
    nameLabel: 'Nazwa kategorii',
    newLabel: 'Nowa kategoria',
    add: 'Dodaj',
    rename: 'Zmień nazwę',
    remove: (name) => `Usuń kategorię ${name}`,
  },
  trash: {
    title: 'Kosz',
    description:
      'Usunięte wydarzenia zostają tu przez 30 dni. Potem są usuwane na zawsze, razem z załącznikami i czatem.',
    empty: 'Kosz jest pusty.',
    withDetached: (count) =>
      count === 1 ? 'z 1 osobno zmienionym wydarzeniem' : `z ${count} osobno zmienionymi wydarzeniami`,
    deletedBy: (name, date) => `Usunięte przez ${name} dnia ${date}`,
    deletedAt: (date) => `Usunięte dnia ${date}`,
    expires: (date) => `zniknie na zawsze ${date}`,
    search: 'Szukaj w koszu',
    searchPlaceholder: 'Tytuł, miejsce lub kto usunął',
    noResults: 'Brak pasujących wpisów.',
    showMore: (shown, total) => `Pokaż więcej (${shown} z ${total})`,
    emptyAction: 'Opróżnij kosz',
    emptyTitle: 'Opróżnić kosz?',
    emptyConfirm: (count) =>
      `Wpisy w koszu (${count}) zostaną usunięte na zawsze, razem z załącznikami i czatem. Tego nie można cofnąć.`,
    emptyConfirmOwn: (own, total) =>
      `${own} z ${total} wpisów zostanie usuniętych na zawsze – te, które możesz usunąć. Tego nie można cofnąć.`,
    restore: 'Przywróć',
    deleteForever: 'Usuń na zawsze',
    deleteForeverLabel: (title) => `Usuń „${title}” na zawsze`,
    confirmTitle: 'Usunąć na zawsze?',
    confirmDelete: (title) =>
      `„${title}” zostanie usunięte na zawsze, razem ze wszystkimi załącznikami i czatem. Tego nie można cofnąć.`,
  },
  share: {
    title: 'Link publiczny',
    description:
      'Udostępnij ten kalendarz każdemu tylko do odczytu, bez logowania. Odwiedzający widzą tytuł, czas, miejsce, opis, linki i kategorie wszystkich wydarzeń, ale nie uczestników, przypomnień ani czatu.',
    label: 'Link publiczny',
    pathLabel: 'Ścieżka dla opcji initial-path',
    create: 'Utwórz link publiczny',
    copy: 'Kopiuj link',
    open: 'Otwórz',
    warning:
      'Każdy, kto ma ten link, może zobaczyć wszystkie wydarzenia z tego kalendarza. Utworzenie nowego linku wyłącza stary.',
    renew: 'Utwórz nowy link',
    remove: 'Zakończ udostępnianie',
    readOnly: 'Tylko do odczytu',
    notFound: 'Ten kalendarz nie jest udostępniony lub link został wyłączony.',
  },
  feed: {
    title: 'Subskrybuj',
    description:
      'Subskrybuj ten kalendarz w Kalendarzu Google, Outlooku lub Kalendarzu Apple. Zmiany pojawią się tam automatycznie, zwykle w ciągu kilku godzin. Subskrypcja służy tylko do odczytu.',
    label: 'Link subskrypcji',
    create: 'Utwórz link subskrypcji',
    copy: 'Kopiuj link',
    openApp: 'Otwórz w aplikacji kalendarza',
    warning: 'Każdy, kto zna ten link, widzi wszystkie wydarzenia tego kalendarza. Nowy link wyłącza poprzedni.',
    renew: 'Utwórz nowy link',
    remove: 'Zakończ subskrypcję',
  },
  ical: {
    title: 'Import i eksport',
    description:
      'Wymieniaj wydarzenia z innymi aplikacjami kalendarza jako plik iCalendar (.ics). Ponowny import aktualizuje wcześniej zaimportowane wydarzenia.',
    exportLabel: 'Eksportuj jako .ics',
    exporting: 'Eksportowanie …',
    importLabel: 'Importuj plik .ics',
    importing: 'Importowanie …',
    imported: (created, updated) => `Dodano: ${created}, zaktualizowano: ${updated}.`,
    skipped: (count) => `Pominięto nieczytelne wpisy: ${count}.`,
    importFailed: 'Plik nie jest prawidłowym plikiem iCalendar.',
    noEvents: 'Ten kalendarz nie ma jeszcze wydarzeń.',
  },
  transfer: {
    title: 'Przekaż własność',
    search: 'Szukaj członków',
    searchPlaceholder: 'Imię lub e-mail',
    noResults: 'Nie znaleziono członka.',
    newOwner: 'Nowy właściciel',
    confirm: 'Potwierdź',
  },
}
