import CalendarPermissions from "./CalendarPermissions";

const user = new CalendarPermissions({
  calendar_a: 'reader',
  calendar_b: 'writer',
  calendar_c: 'nominator',
});

user.canRead('calendar_a');       // true
user.canWrite('calendar_a');      // false
user.canNominate('calendar_b');   // false
user.can('calendar_c', 'nominate'); // true

user.getRole('calendar_b');       // 'writer'
user.getPermissions('calendar_b'); // { read: true, write: true, nominate: false }

user.readableCalendars;           // ['calendar_a', 'calendar_b', 'calendar_c']
user.writableCalendars;           // ['calendar_b', 'calendar_c']
user.nominatableCalendars;        // ['calendar_c']

user.getCalendarsWithMinRole('writer'); // calendars with writer or nominator role

user.setRole('calendar_d', 'nominator'); // dynamically update
