export const storage = {
  importTitle: 'Import local events?',
  importMessage: (count: number) =>
    `${count === 1 ? 'One event is' : `${count} events are`} stored in this browser without an account. Do you want to move ${count === 1 ? 'it' : 'them'} to your account? ${count === 1 ? 'It' : 'They'} will then be available on all your devices and removed from this browser.`,
  importing: 'Importing …',
  importConfirm: 'Move to my account',
  keepLocal: 'Keep in this browser only',
}
