const CALENDARS = Array.from({ length: 12 }, (_, i) =>
  `calendar_${String.fromCharCode(97 + i)}` // calendar_a ... calendar_l
);

const ROLE_HIERARCHY = { none: 0, reader: 1, writer: 2, nominator: 3 };

const PERMISSIONS = {
  none: { read: false, write: false, nominate: false },
  reader: { read: true, write: false, nominate: false },
  writer: { read: true, write: true, nominate: false },
  nominator: { read: true, write: true, nominate: true },
};

class CalendarPermissions {
  /**
   * @param {Object} userRoles - map of calendarId -> role
   *   e.g. { calendar_a: 'reader', calendar_c: 'nominator' }
   */
  constructor(userRoles = {}) {
    this._roles = {};
    for (const calId of CALENDARS) {
      const role = userRoles[calId] ?? 'none';
      if (!PERMISSIONS[role]) throw new Error(`Invalid role "${role}" for ${calId}`);
      this._roles[calId] = role;
    }
  }

  // ── role access ────────────────────────────────────────────────

  /** Returns the user's role on a given calendar. */
  getRole(calendarId) {
    this._assertCalendar(calendarId);
    return this._roles[calendarId];
  }

  /** Returns every calendar -> role mapping for the user. */
  getAllRoles() {
    return { ...this._roles };
  }

  /** Returns all calendars where the user has at least `minRole`. */
  getCalendarsWithMinRole(minRole) {
    this._assertRole(minRole);
    const minLevel = ROLE_HIERARCHY[minRole];
    return CALENDARS.filter(id => ROLE_HIERARCHY[this._roles[id]] >= minLevel);
  }

  // ── permission checks ──────────────────────────────────────────

  /** Can the user read from this calendar? */
  canRead(calendarId) {
    return this._check(calendarId, 'read');
  }

  /** Can the user write to this calendar? */
  canWrite(calendarId) {
    return this._check(calendarId, 'write');
  }

  /** Can the user nominate on this calendar? */
  canNominate(calendarId) {
    return this._check(calendarId, 'nominate');
  }

  /**
   * Check any permission by name.
   * @param {string} calendarId
   * @param {'read'|'write'|'nominate'} action
   */
  can(calendarId, action) {
    return this._check(calendarId, action);
  }

  /** Returns the full permission object for a calendar. */
  getPermissions(calendarId) {
    this._assertCalendar(calendarId);
    return { ...PERMISSIONS[this._roles[calendarId]] };
  }

  // ── bulk queries ───────────────────────────────────────────────

  /** All calendars the user can read. */
  get readableCalendars() {
    return CALENDARS.filter(id => this.canRead(id));
  }

  /** All calendars the user can write to. */
  get writableCalendars() {
    return CALENDARS.filter(id => this.canWrite(id));
  }

  /** All calendars the user can nominate on. */
  get nominatableCalendars() {
    return CALENDARS.filter(id => this.canNominate(id));
  }

  // ── role mutation ──────────────────────────────────────────────

  /** Assign a role for a calendar (useful for admin workflows). */
  setRole(calendarId, role) {
    this._assertCalendar(calendarId);
    this._assertRole(role);
    this._roles[calendarId] = role;
  }

  // ── internals ─────────────────────────────────────────────────

  _check(calendarId, action) {
    this._assertCalendar(calendarId);
    if (!['read', 'write', 'nominate'].includes(action)) {
      throw new Error(`Unknown action "${action}"`);
    }
    return PERMISSIONS[this._roles[calendarId]][action];
  }

  _assertCalendar(id) {
    if (!CALENDARS.includes(id)) throw new Error(`Unknown calendar "${id}"`);
  }

  _assertRole(role) {
    if (!PERMISSIONS[role]) throw new Error(`Unknown role "${role}"`);
  }
}

export default CalendarPermissions;
