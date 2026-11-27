import type { Messages } from '../types.ts'
import { plural } from './grammar.ts'

export const views: Messages['views'] = {
  label: 'Widok',
  day: { label: 'Dzień', previous: 'Poprzedni dzień', next: 'Następny dzień' },
  week: { label: 'Tydzień', previous: 'Poprzedni tydzień', next: 'Następny tydzień' },
  month: { label: 'Miesiąc', previous: 'Poprzedni miesiąc', next: 'Następny miesiąc' },
  year: { label: 'Rok', previous: 'Poprzedni rok', next: 'Następny rok' },
  agenda: {
    label: 'Lista',
    previous: 'Poprzednie 30 dni',
    next: 'Następne 30 dni',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Cały dzień',
    empty: 'Brak wydarzeń w tych 30 dniach.',
  },
  tasks: { label: 'Zadania' },
  weekNumber: (week) => `Tydz. ${week}`,
  weekNumberLong: (week) => `Tydzień ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Dziś',
  newEvent: 'Nowe wydarzenie',
  now: (time) => `Teraz: ${time}`,
  ownResponse: (status) => `Twoja odpowiedź: ${status}`,
  newEventAt: (day, time) => `Nowe wydarzenie: ${day}, ${time}`,
  todayMark: 'dzisiaj',
  openDay: (date) => `Otwórz ${date}`,
  moreEvents: (count) => `+${count} więcej`,
  moreLinks: (count) => `+${count} więcej linków`,
  holiday: (name) => `Święto: ${name}`,
  fromCalendar: (name) => `Z kalendarza „${name}”`,
  sharedEventNotice: (source) => `${source}. Wszyscy członkowie widzą zmiany.`,
  dismiss: 'Zamknij',
  undo: {
    action: 'Cofnij',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `Usunięto „${title}”`,
    moved: (title) => `Przeniesiono „${title}”`,
  },
  menu: {
    open: 'Otwórz menu',
    openMarked: 'Otwórz menu (filtr aktywny)',
    title: 'Menu',
    active: 'aktywny',
    calendarSettings: 'Ustawienia kalendarza',
    calendarGroup: (name) => `Kalendarz: ${name}`,
  },
  filter: {
    open: 'Filtruj według kategorii',
    openActive: 'Filtruj według kategorii (aktywne)',
    title: 'Filtruj według kategorii',
    uncategorized: 'Bez kategorii',
    reset: 'Pokaż wszystko',
  },
  search: {
    open: 'Szukaj',
    title: 'Szukaj wydarzeń',
    placeholder: 'Tytuł, miejsce lub opis',
    hint: 'Wpisz co najmniej 2 znaki.',
    empty: 'Nie znaleziono wydarzeń.',
    searching: 'Wyszukiwanie …',
  },
  print: {
    open: 'Drukuj lub zapisz jako PDF',
    empty: 'Brak wydarzeń w tym okresie.',
  },
  jump: {
    open: 'Przejdź do daty',
    previousMonth: 'Poprzedni miesiąc',
    nextMonth: 'Następny miesiąc',
  },
  quickCreate: {
    title: 'Dodaj tytuł',
    untitled: '(Bez tytułu)',
    more: 'Więcej opcji',
    inCalendar: (name) => `W kalendarzu ${name}`,
  },
  peek: {
    edit: 'Edytuj',
    details: 'Szczegóły',
    attendees: (count) => `${count} ${plural(count, 'uczestnik', 'uczestnicy', 'uczestników')}`,
  },
  shortcutHelp: {
    title: 'Skróty klawiszowe',
    navigation: 'Nawigacja',
    actions: 'Działania',
    previousNext: 'Poprzedni lub następny okres',
    moveFocus: 'Przechodzenie między godzinami lub wydarzeniami',
    undo: 'Cofnij',
  },
  tour: {
    label: 'Przewodnik',
    count: (current, total) => `Krok ${current} z ${total}`,
    back: 'Wstecz',
    next: 'Dalej',
    close: 'Zakończ',
    done: 'Gotowe',
    steps: {
      grid: {
        title: 'Dodawanie wydarzeń',
        text: 'Kliknij godzinę, aby od razu dodać wydarzenie, albo przeciągnij, aby wybrać czas trwania. Kliknij wydarzenie, aby zobaczyć szczegóły.',
        touch:
          'Dotknij godziny, aby dodać wydarzenie; przytrzymaj i przeciągnij, aby wybrać czas trwania. Dotknij wydarzenia, aby zobaczyć szczegóły.',
      },
      create: {
        title: 'Wszystkie opcje',
        text: 'Przycisk plus otwiera pełny formularz z powtarzaniem, przypomnieniami, miejscem i nie tylko.',
        tasks: 'Na górze formularza możesz zamiast wydarzenia wybrać zadanie.',
      },
      navigate: {
        title: 'Poruszanie się w czasie',
        text: 'Strzałki przechodzą o okres wstecz lub naprzód, „Dziś” wraca do dzisiejszego dnia.',
        swipe: 'Możesz też przesunąć palcem w lewo lub w prawo.',
        keys: 'Na klawiaturze: ← → i T.',
      },
      jump: {
        title: 'Przejście do daty',
        text: 'Kliknij tytuł, aby otworzyć kalendarz miesięczny i przejść do dowolnej daty.',
      },
      switch: {
        title: 'Zmiana kalendarza',
        text: 'Tu widzisz, który kalendarz jest aktywny. Kliknij, aby go zmienić. Zaznaczone kalendarze zespołów i udostępnione pojawiają się też w Twoim kalendarzu osobistym.',
      },
      views: {
        title: 'Widoki',
        text: 'Przełączaj między dniem, tygodniem, miesiącem, rokiem i listą.',
        keys: 'Naciśnij ?, aby zobaczyć wszystkie skróty klawiszowe.',
      },
      tasks: {
        title: 'Zadania',
        text: 'Tu znajdziesz swoje zadania, jako listę lub tablicę. Zadanie ma termin, status, priorytet i listę kontrolną. Zadania z terminem pojawiają się też w widoku dnia i tygodnia, na górze swojego dnia.',
      },
      planner: {
        title: 'Automatyczne planowanie zadań',
        text: 'Podaj szacowany nakład pracy zadania i wybierz w zadaniu „Zaplanuj”. Planer znajdzie wolny czas przed terminem, zostawi krótkie przerwy między wydarzeniami i pokaże bloki w podglądzie, zanim je dodasz.',
      },
      menu: {
        title: 'Menu',
        text: 'W menu znajdziesz wyszukiwanie, filtry i skróty klawiszowe oraz wszystko o aktywnym kalendarzu, np. ustawienia, udostępnianie, import i eksport oraz kosz.',
      },
      notifications: {
        title: 'Powiadomienia',
        text: 'Tu trafiają zaproszenia, odpowiedzi, zmiany wprowadzone przez innych i przypomnienia.',
      },
      account: {
        title: 'Twoje konto',
        text: 'Tu otworzysz swoje ustawienia, np. profil, bezpieczeństwo, powiadomienia i reguły planera, albo się wylogujesz.',
      },
      signIn: {
        title: 'Zaloguj się',
        text: 'Z kontem korzystasz z kalendarza na wszystkich swoich urządzeniach i możesz udostępniać kalendarze innym.',
      },
      done: {
        title: 'Wszystko gotowe',
        text: 'Ten przewodnik możesz w każdej chwili uruchomić ponownie w menu, w pozycji „Przewodnik”.',
      },
    },
  },
}
