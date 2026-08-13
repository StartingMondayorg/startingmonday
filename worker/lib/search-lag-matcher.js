const DAY_MS = 86_400_000

function parseDate(value) {
  const text = String(value ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [year, month, day] = text.split('-').map(Number)
  const parsed = Date.UTC(year, month - 1, day)
  const roundTrip = new Date(parsed).toISOString().slice(0, 10)
  return roundTrip === text ? parsed : null
}

function addUtcMonthsClamped(dateMs, months) {
  const date = new Date(dateMs)
  const targetMonthIndex = date.getUTCMonth() + months
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12)
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12
  const finalDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  return Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), finalDay))
}

export function normalizeSearchLagCik(value) {
  const normalized = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '')
  return normalized || null
}

function percentile(sorted, ratio) {
  if (!sorted.length) return null
  return sorted[Math.floor((sorted.length - 1) * ratio)]
}

export function matchExecutiveSearchLags(positionRows, { windowMonths = 18, asOfDate = null } = {}) {
  const asOfMs = asOfDate === null ? null : parseDate(asOfDate)
  if (asOfDate !== null && asOfMs === null) throw new Error('invalid_as_of_date')
  const groups = new Map()
  const holds = {
    missing_company_identity: 0,
    missing_role_identity: 0,
    missing_departure_executive_identity: 0,
    invalid_departure_date: 0,
    no_appointment_in_window: 0,
    appointment_after_as_of: 0,
    missing_appointment_executive_identity: 0,
    same_executive_appointment: 0,
    ambiguous_earliest_appointment: 0,
    appointment_reused: 0,
  }
  let departureCandidates = 0

  for (const row of positionRows ?? []) {
    if (!row?.end_date) continue
    departureCandidates += 1
    const companyCik = normalizeSearchLagCik(row.company_cik)
    if (!companyCik) {
      holds.missing_company_identity += 1
      continue
    }
    if (!row.title_normalized) {
      holds.missing_role_identity += 1
      continue
    }
    if (!row.executive_id) {
      holds.missing_departure_executive_identity += 1
      continue
    }
    if (parseDate(row.end_date) === null) {
      holds.invalid_departure_date += 1
      continue
    }
    const key = `${companyCik}::${row.title_normalized}`
    if (!groups.has(key)) groups.set(key, { departures: [], appointments: [] })
    groups.get(key).departures.push({ ...row, companyCik })
  }

  for (const row of positionRows ?? []) {
    const companyCik = normalizeSearchLagCik(row?.company_cik)
    if (!companyCik || !row?.title_normalized || !row?.start_date) continue
    const key = `${companyCik}::${row.title_normalized}`
    if (!groups.has(key)) continue
    groups.get(key).appointments.push({ ...row, companyCik })
  }

  const matches = []
  const usedAppointmentIds = new Set()

  for (const group of groups.values()) {
    const departures = [...group.departures].sort((left, right) => (
      String(left.end_date).localeCompare(String(right.end_date))
      || String(left.id).localeCompare(String(right.id))
    ))
    const appointments = [...group.appointments].sort((left, right) => (
      String(left.start_date).localeCompare(String(right.start_date))
      || String(left.id).localeCompare(String(right.id))
    ))

    for (const departure of departures) {
      const departureMs = parseDate(departure.end_date)
      const windowEndMs = addUtcMonthsClamped(departureMs, windowMonths)
      const inWindow = appointments.filter((appointment) => {
        if (appointment.id === departure.id) return false
        const appointmentMs = parseDate(appointment.start_date)
        return appointmentMs !== null && appointmentMs > departureMs && appointmentMs <= windowEndMs
      })

      if (!inWindow.length) {
        holds.no_appointment_in_window += 1
        continue
      }

      const observable = asOfMs === null
        ? inWindow
        : inWindow.filter((appointment) => parseDate(appointment.start_date) <= asOfMs)
      if (!observable.length) {
        holds.appointment_after_as_of += 1
        continue
      }

      const earliestDate = observable[0].start_date
      const earliest = observable.filter((appointment) => appointment.start_date === earliestDate)
      if (earliest.some((appointment) => !appointment.executive_id)) {
        holds.missing_appointment_executive_identity += 1
        continue
      }
      if (earliest.length !== 1) {
        holds.ambiguous_earliest_appointment += 1
        continue
      }

      const appointment = earliest[0]
      if (appointment.executive_id === departure.executive_id) {
        holds.same_executive_appointment += 1
        continue
      }
      if (usedAppointmentIds.has(appointment.id)) {
        holds.appointment_reused += 1
        continue
      }
      usedAppointmentIds.add(appointment.id)

      const appointmentMs = parseDate(appointment.start_date)
      matches.push({
        departureId: departure.id,
        appointmentId: appointment.id,
        companyName: departure.company_name ?? appointment.company_name ?? null,
        companyCik: departure.companyCik,
        companySector: departure.company_sector ?? null,
        companySicCode: departure.company_sic_code ?? null,
        companyStage: departure.company_stage ?? null,
        companyRevenueBand: departure.company_revenue_band ?? null,
        titleNormalized: departure.title_normalized,
        lagDays: Math.round((appointmentMs - departureMs) / DAY_MS),
        replacementType: 'unknown',
        searchYear: Number(String(departure.end_date).slice(0, 4)),
      })
    }
  }

  const lagDays = matches.map((match) => match.lagDays).sort((left, right) => left - right)
  return {
    matches,
    summary: {
      positionRows: positionRows?.length ?? 0,
      departureCandidates,
      matchedPairs: matches.length,
      heldDepartures: Object.values(holds).reduce((total, count) => total + count, 0),
      holds,
      lagDays: {
        minimum: lagDays[0] ?? null,
        p25: percentile(lagDays, 0.25),
        median: percentile(lagDays, 0.5),
        p75: percentile(lagDays, 0.75),
        maximum: lagDays.at(-1) ?? null,
      },
      matchingContract: {
        companyIdentity: 'normalized_nonempty_cik',
        roleIdentity: 'exact_title_normalized',
        appointmentSelection: 'unique_earliest_after_departure',
        windowMonths,
        windowBoundary: 'same_day_or_final_day_of_target_month',
        asOfDate,
        executiveIdentityRequired: true,
        sameExecutiveExcluded: true,
        appointmentReuseAllowed: false,
        replacementType: 'unknown_until_prior-employer-evidence',
      },
    },
  }
}