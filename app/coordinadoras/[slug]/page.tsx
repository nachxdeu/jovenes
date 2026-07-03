import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { TaskForm } from "../../../components/forms";
import {
  ActivityCard,
  ArgumentCardView,
  DocumentCard,
  EmptyState,
  EventCard,
  MinuteCard,
  PageHeader,
  Panel,
  SectionTitle,
  TaskList,
} from "../../../components/ui";
import { getCoordinator, isCoordinatorSlug } from "../../../lib/catalog";
import { getCoordinatorBundle } from "../../../lib/repository";
import { requireInternalProfile } from "../../../lib/session";

export const dynamic = "force-dynamic";

export default async function CoordinatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCoordinatorSlug(slug)) notFound();

  const profile = await requireInternalProfile(`/coordinadoras/${slug}`);
  const coordinator = getCoordinator(slug);
  if (!coordinator) notFound();

  const bundle = await getCoordinatorBundle(slug);
  const activityCount =
    bundle.documents.length +
    bundle.minutes.length +
    bundle.events.length +
    bundle.activities.length;

  return (
    <AppShell current={`/coordinadoras/${slug}`} profile={profile}>
      <PageHeader eyebrow="Coordinadora" title={coordinator.name}>
        <div className="max-w-md text-sm font-semibold leading-6 text-zinc-700">
          {coordinator.description}
        </div>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Argumentario" value={bundle.argumentCards.length} />
        <Metric label="Documentos" value={bundle.documents.length} />
        <Metric label="Actas" value={bundle.minutes.length} />
        <Metric label="Actividad" value={activityCount} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <SectionTitle title="Tareas y acuerdos pendientes" />
          <div className="mt-3">
            <TaskList profile={profile} tasks={bundle.tasks} />
          </div>
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <TaskForm defaultCoordinator={slug} profile={profile} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Historial de actividad" />
          <div className="mt-4 grid gap-3">
            {bundle.events.slice(0, 4).map((event) => (
              <EventCard event={event} key={event.id} profile={profile} />
            ))}
            {bundle.activities.slice(0, 4).map((activity) => (
              <ActivityCard
                activity={activity}
                key={activity.id}
                profile={profile}
              />
            ))}
            {!bundle.events.length && !bundle.activities.length ? (
              <EmptyState>No hay actividad registrada todavía.</EmptyState>
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <SectionTitle title="Argumentario" />
          <div className="mt-4 grid gap-3">
            {bundle.argumentCards.length ? (
              bundle.argumentCards.map((card) => (
                <ArgumentCardView card={card} key={card.id} profile={profile} />
              ))
            ) : (
              <EmptyState>No hay fichas de esta coordinadora.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Documentos" />
          <div className="mt-4 grid gap-3">
            {bundle.documents.length ? (
              bundle.documents.map((document) => (
                <DocumentCard
                  document={document}
                  key={document.id}
                  profile={profile}
                />
              ))
            ) : (
              <EmptyState>No hay documentos de esta coordinadora.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Actas" />
          <div className="mt-4 grid gap-3">
            {bundle.minutes.length ? (
              bundle.minutes.map((minute) => (
                <MinuteCard key={minute.id} minute={minute} profile={profile} />
              ))
            ) : (
              <EmptyState>No hay actas de esta coordinadora.</EmptyState>
            )}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-4">
      <p className="text-2xl font-black text-[var(--primary-dark)]">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-zinc-500">{label}</p>
    </div>
  );
}
