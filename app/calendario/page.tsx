import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { EventForm } from "../../components/forms";
import {
  CoordinatorBadge,
  EmptyState,
  EventCard,
  PageHeader,
  Panel,
  SectionTitle,
} from "../../components/ui";
import { coordinators, eventTypes } from "../../lib/catalog";
import { listEvents } from "../../lib/repository";
import { requireInternalProfile } from "../../lib/session";
import type { InternalEvent } from "../../lib/types";
import { formatMonth, todayIso } from "../../lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const profile = await requireInternalProfile("/calendario");
  const month = first(params.mes) || todayIso().slice(0, 7);
  const view = first(params.vista) || "mes";
  const [from, to] = monthRange(month);
  const filters = {
    search: first(params.q),
    coordinator: first(params.coordinadora),
    type: first(params.tipo),
  };
  const events = await listEvents({ ...filters, from, to });
  const list = await listEvents({ ...filters, from: todayIso(), limit: 100 });

  return (
    <AppShell current="/calendario" profile={profile}>
      <PageHeader eyebrow="Agenda interna" title="Calendario" />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Panel>
          <SectionTitle title="Nuevo evento" />
          <div className="mt-4">
            <EventForm profile={profile} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Eventos" />
          <form className="mt-4 grid gap-3" method="get">
            <div className="grid gap-3 md:grid-cols-5">
              <input
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                defaultValue={filters.search}
                name="q"
                placeholder="Buscar"
              />
              <input
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                defaultValue={month}
                name="mes"
                type="month"
              />
              <select
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold"
                defaultValue={filters.coordinator}
                name="coordinadora"
              >
                <option value="">Todas</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator.slug} value={coordinator.slug}>
                    {coordinator.name}
                  </option>
                ))}
              </select>
              <select
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold"
                defaultValue={filters.type}
                name="tipo"
              >
                <option value="">Todos los tipos</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button className="focus-ring rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-black text-white">
                Filtrar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={`focus-ring rounded-md px-3 py-2 text-xs font-black ${
                  view === "mes"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 text-zinc-800"
                }`}
                href={calendarHref(params, "mes")}
              >
                Vista mensual
              </Link>
              <Link
                className={`focus-ring rounded-md px-3 py-2 text-xs font-black ${
                  view === "lista"
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 text-zinc-800"
                }`}
                href={calendarHref(params, "lista")}
              >
                Vista lista
              </Link>
              <Link
                className="focus-ring rounded-md border border-zinc-300 px-3 py-2 text-xs font-black text-zinc-800"
                href="/calendario"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mt-5">
            {view === "lista" ? (
              <div className="grid gap-3">
                {list.length ? (
                  list.map((event) => (
                    <EventCard event={event} key={event.id} profile={profile} />
                  ))
                ) : (
                  <EmptyState>No hay eventos próximos.</EmptyState>
                )}
              </div>
            ) : (
              <CalendarGrid events={events} month={month} />
            )}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}

function CalendarGrid({
  events,
  month,
}: {
  events: InternalEvent[];
  month: string;
}) {
  const days = calendarDays(month);
  return (
    <div>
      <h2 className="mb-3 text-xl font-black capitalize">{formatMonth(month)}</h2>
      <div className="grid grid-cols-7 rounded-lg border border-[var(--line)] bg-white text-xs font-black uppercase text-zinc-500">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div className="border-b border-[var(--line)] px-2 py-2" key={day}>
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter((event) => event.eventDate === day.iso);
          return (
            <div
              className={`min-h-28 border-b border-r border-[var(--line)] p-2 ${
                day.inMonth ? "bg-white" : "bg-zinc-50 text-zinc-400"
              }`}
              key={day.iso}
            >
              <p className="font-black">{day.number}</p>
              <div className="mt-2 grid gap-1">
                {dayEvents.map((event) => (
                  <div
                    className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-bold leading-4 text-zinc-800"
                    key={event.id}
                  >
                    <div className="mb-1">
                      <CoordinatorBadge slug={event.coordinatorSlug} />
                    </div>
                    {event.eventTime ? `${event.eventTime} ` : ""}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function monthRange(month: string): [string, string] {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const lastDay = new Date(year, monthIndex, 0);
  return [toIso(firstDay), toIso(lastDay)];
}

function calendarDays(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: toIso(date),
      inMonth: date.getMonth() === monthIndex - 1,
      number: date.getDate(),
    };
  });
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarHref(
  params: Record<string, string | string[] | undefined>,
  view: string,
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    next.set(key, Array.isArray(value) ? value[0] ?? "" : value);
  }
  next.set("vista", view);
  return `/calendario?${next.toString()}`;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
