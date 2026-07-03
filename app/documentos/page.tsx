import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { DocumentForm } from "../../components/forms";
import {
  DocumentCard,
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
} from "../../components/ui";
import { coordinators, documentTypes } from "../../lib/catalog";
import { listDocuments } from "../../lib/repository";
import { requireInternalProfile } from "../../lib/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const profile = await requireInternalProfile("/documentos");
  const filters = {
    search: first(params.q),
    coordinator: first(params.coordinadora),
    type: first(params.tipo),
    from: first(params.desde),
    to: first(params.hasta),
  };
  const documents = await listDocuments(filters);

  return (
    <AppShell current="/documentos" profile={profile}>
      <PageHeader eyebrow="Archivo interno" title="Documentos" />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <Panel>
          <SectionTitle title="Nuevo documento" />
          <div className="mt-4">
            <DocumentForm profile={profile} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Buscar y filtrar" />
          <form className="mt-4 grid gap-3" method="get">
            <input
              className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
              defaultValue={filters.search}
              name="q"
              placeholder="Buscar por título, responsable o etiquetas"
            />
            <div className="grid gap-3 md:grid-cols-4">
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
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                defaultValue={filters.from}
                name="desde"
                type="date"
              />
              <input
                className="focus-ring min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                defaultValue={filters.to}
                name="hasta"
                type="date"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="focus-ring rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-black text-white">
                Filtrar
              </button>
              <Link
                className="focus-ring rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-800"
                href="/documentos"
              >
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mt-5 grid gap-3">
            {documents.length ? (
              documents.map((document) => (
                <DocumentCard
                  document={document}
                  key={document.id}
                  profile={profile}
                />
              ))
            ) : (
              <EmptyState>No hay documentos con esos filtros.</EmptyState>
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
