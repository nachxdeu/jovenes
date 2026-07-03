import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { ActivityForm } from "../../components/forms";
import {
  ActivityCard,
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
} from "../../components/ui";
import { activityTypes, coordinators } from "../../lib/catalog";
import {
  distinctActivityYears,
  distinctCampaigns,
  listActivities,
} from "../../lib/repository";
import { requireInternalProfile } from "../../lib/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MemoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const profile = await requireInternalProfile("/memoria");
  const filters = {
    search: first(params.q),
    coordinator: first(params.coordinadora),
    year: first(params.anio),
    type: first(params.tipo),
    campaign: first(params.campana),
  };
  const [activities, years, campaigns] = await Promise.all([
    listActivities(filters),
    distinctActivityYears(),
    distinctCampaigns(),
  ]);

  return (
    <AppShell current="/memoria" profile={profile}>
      <PageHeader
        eyebrow="Archivo político y organizativo"
        title="Memoria de actividades"
      />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <Panel>
          <SectionTitle title="Nueva actividad" />
          <div className="mt-4">
            <ActivityForm profile={profile} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Archivo histórico" />
          <form className="mt-4 grid gap-3" method="get">
            <input
              className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
              defaultValue={filters.search}
              name="q"
              placeholder="Buscar por actividad, objetivo, campaña o etiqueta"
            />
            <div className="grid gap-3 md:grid-cols-4">
              <select
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold"
                defaultValue={filters.year}
                name="anio"
              >
                <option value="">Todos los años</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
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
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold"
                defaultValue={filters.campaign}
                name="campana"
              >
                <option value="">Todas las campañas</option>
                {campaigns.map((campaign) => (
                  <option key={campaign} value={campaign}>
                    {campaign}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="focus-ring rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-black text-white">
                Filtrar
              </button>
              <Link
                className="focus-ring rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-800"
                href="/memoria"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mt-5 grid gap-3">
            {activities.length ? (
              activities.map((activity) => (
                <ActivityCard
                  activity={activity}
                  key={activity.id}
                  profile={profile}
                />
              ))
            ) : (
              <EmptyState>No hay actividades con esos filtros.</EmptyState>
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
