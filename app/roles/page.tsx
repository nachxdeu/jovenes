import { AppShell } from "../../components/app-shell";
import {
  CoordinatorBadge,
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
} from "../../components/ui";
import { listUsers } from "../../lib/repository";
import { requireInternalProfile, roleLabel } from "../../lib/session";

export const dynamic = "force-dynamic";

const roleRows = [
  {
    role: "Administrador/a",
    access: "Crear, editar y borrar todo el archivo interno.",
  },
  {
    role: "Coordinador/a",
    access: "Gestionar documentos, actas, eventos, memoria y tareas de su coordinadora.",
  },
  {
    role: "Usuario/a interno",
    access: "Consultar documentos, actas, calendario y memoria.",
  },
];

export default async function RolesPage() {
  const profile = await requireInternalProfile("/roles");
  const users = await listUsers();

  return (
    <AppShell current="/roles" profile={profile}>
      <PageHeader eyebrow="Acceso interno" title="Roles de usuario" />

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <SectionTitle title="Permisos" />
          <div className="mt-4 divide-y divide-[var(--line)]">
            {roleRows.map((row) => (
              <div className="py-4" key={row.role}>
                <h3 className="font-black">{row.role}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{row.access}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Personas registradas" />
          <div className="mt-4 grid gap-3">
            {users.length ? (
              users.map((user) => (
                <article
                  className="rounded-lg border border-[var(--line)] bg-white p-4"
                  key={user.email}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-black">{user.name}</h3>
                      <p className="text-sm font-semibold text-zinc-500">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white">
                        {roleLabel(user.role)}
                      </span>
                      {user.coordinatorSlug ? (
                        <CoordinatorBadge slug={user.coordinatorSlug} />
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState>No hay personas registradas.</EmptyState>
            )}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
