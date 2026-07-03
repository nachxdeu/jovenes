import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { MinuteForm } from "../../components/forms";
import {
  EmptyState,
  MinuteCard,
  PageHeader,
  Panel,
  SectionTitle,
} from "../../components/ui";
import { coordinators } from "../../lib/catalog";
import { listMinutes } from "../../lib/repository";
import { requireInternalProfile } from "../../lib/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MinutesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const profile = await requireInternalProfile("/actas");
  const filters = {
    search: first(params.q),
    space: first(params.espacio),
  };
  const minutes = await listMinutes(filters);

  return (
    <AppShell current="/actas" profile={profile}>
      <PageHeader eyebrow="Reuniones y acuerdos" title="Actas" />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <Panel>
          <SectionTitle title="Nueva acta" />
          <div className="mt-4">
            <MinuteForm profile={profile} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Actas publicadas" />
          <form className="mt-4 grid gap-3" method="get">
            <input
              className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
              defaultValue={filters.search}
              name="q"
              placeholder="Buscar por reunión, acuerdos o tareas"
            />
            <div className="flex flex-wrap gap-2">
              <select
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold"
                defaultValue={filters.space}
                name="espacio"
              >
                <option value="">Todos los espacios</option>
                <option value="general">General</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator.slug} value={coordinator.slug}>
                    {coordinator.name}
                  </option>
                ))}
              </select>
              <button className="focus-ring rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-black text-white">
                Filtrar
              </button>
              <Link
                className="focus-ring rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-800"
                href="/actas"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mt-5 grid gap-3">
            {minutes.length ? (
              minutes.map((minute) => (
                <MinuteCard key={minute.id} minute={minute} profile={profile} />
              ))
            ) : (
              <EmptyState>No hay actas con esos filtros.</EmptyState>
            )}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
