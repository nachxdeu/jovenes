"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  argumentCardTypes,
  documentTypes,
  eventTypes,
  isCoordinatorSlug,
} from "../lib/catalog";
import {
  createActivity,
  createArgumentCard,
  createDocument,
  createEvent,
  createMinute,
  createTask,
  deleteRecord,
  getRecordScope,
} from "../lib/repository";
import { canCreateFor, canManage, requireInternalProfile } from "../lib/session";
import type { CoordinatorSlug } from "../lib/types";
import { todayIso, uid } from "../lib/utils";

type TableName =
  | "documents"
  | "minutes"
  | "events"
  | "activities"
  | "tasks"
  | "argument_cards";

export async function addDocument(formData: FormData) {
  const profile = await requireInternalProfile("/documentos");
  const coordinatorSlug = requiredCoordinator(formData, "coordinatorSlug");
  if (!canCreateFor(profile, coordinatorSlug)) deny();

  const id = uid("doc");
  const uploaded = await uploadAttachment(formData, id, "documents");
  const fallbackUrl = text(formData, "attachmentUrl");
  const fallbackName = text(formData, "attachmentName");
  const type = text(formData, "type");
  const documentType = documentTypes.find((item) => item === type) ?? "otro";

  await createDocument({
    id,
    title: requiredText(formData, "title"),
    summary: text(formData, "summary"),
    coordinatorSlug,
    type: documentType,
    uploadedAt: text(formData, "uploadedAt") || todayIso(),
    owner: requiredText(formData, "owner"),
    attachmentName: uploaded.name || fallbackName,
    attachmentUrl: uploaded.url || fallbackUrl,
    tags: text(formData, "tags"),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect("/documentos");
}

export async function addMinute(formData: FormData) {
  const profile = await requireInternalProfile("/actas");
  const spaceSlug = text(formData, "spaceSlug") || "general";
  if (spaceSlug !== "general" && !isCoordinatorSlug(spaceSlug)) deny();
  if (!canManage(profile, spaceSlug as CoordinatorSlug | "general")) deny();

  const id = uid("acta");
  const uploaded = await uploadAttachment(formData, id, "minutes");

  await createMinute({
    id,
    title: requiredText(formData, "title"),
    meetingDate: requiredText(formData, "meetingDate"),
    spaceSlug: spaceSlug as CoordinatorSlug | "general",
    attendees: text(formData, "attendees"),
    agenda: text(formData, "agenda"),
    agreements: text(formData, "agreements"),
    assignedTasks: text(formData, "assignedTasks"),
    nextMeeting: text(formData, "nextMeeting"),
    attachmentUrl: uploaded.url || text(formData, "attachmentUrl"),
    body: text(formData, "body"),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect("/actas");
}

export async function addEvent(formData: FormData) {
  const profile = await requireInternalProfile("/calendario");
  const coordinatorSlug = requiredCoordinator(formData, "coordinatorSlug");
  if (!canCreateFor(profile, coordinatorSlug)) deny();
  const type = text(formData, "type");
  const eventType = eventTypes.find((item) => item === type) ?? "otro";

  await createEvent({
    id: uid("evt"),
    title: requiredText(formData, "title"),
    eventDate: requiredText(formData, "eventDate"),
    eventTime: text(formData, "eventTime"),
    place: text(formData, "place"),
    description: text(formData, "description"),
    coordinatorSlug,
    type: eventType,
    people: text(formData, "people"),
    resourceUrl: text(formData, "resourceUrl"),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect("/calendario");
}

export async function addActivity(formData: FormData) {
  const profile = await requireInternalProfile("/memoria");
  const coordinatorSlugs: CoordinatorSlug[] = formData
    .getAll("coordinatorSlugs")
    .map((value) => String(value))
    .filter(isCoordinatorSlug);
  const scoped: CoordinatorSlug[] = coordinatorSlugs.length
    ? coordinatorSlugs
    : ["estrategia"];
  if (!scoped.some((slug) => canCreateFor(profile, slug))) deny();

  const activityDate = requiredText(formData, "activityDate");
  await createActivity({
    id: uid("mem"),
    title: requiredText(formData, "title"),
    activityDate,
    year: Number(activityDate.slice(0, 4)),
    place: text(formData, "place"),
    description: text(formData, "description"),
    coordinatorSlugs: scoped,
    objective: text(formData, "objective"),
    materials: text(formData, "materials"),
    links: text(formData, "links"),
    evaluation: text(formData, "evaluation"),
    tags: text(formData, "tags"),
    type: text(formData, "type") || "otro",
    campaign: text(formData, "campaign"),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect("/memoria");
}

export async function addArgumentCard(formData: FormData) {
  const profile = await requireInternalProfile("/argumentario");
  const coordinatorSlug = requiredCoordinator(formData, "coordinatorSlug");
  if (!canCreateFor(profile, coordinatorSlug)) deny();

  const type = text(formData, "type");
  const argumentType =
    argumentCardTypes.find((item) => item === type) ?? "ficha";

  await createArgumentCard({
    id: uid("arg"),
    title: requiredText(formData, "title"),
    summary: text(formData, "summary"),
    topic: requiredText(formData, "topic"),
    territory: text(formData, "territory") || "General",
    type: argumentType,
    coordinatorSlug,
    campaign: text(formData, "campaign"),
    keyMessages: text(formData, "keyMessages"),
    dataPoints: text(formData, "dataPoints"),
    rebuttal: text(formData, "rebuttal"),
    sources: text(formData, "sources"),
    tags: text(formData, "tags"),
    updatedAt: text(formData, "updatedAt") || todayIso(),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect("/argumentario");
}

export async function addTask(formData: FormData) {
  const profile = await requireInternalProfile("/");
  const coordinatorSlug = requiredCoordinator(formData, "coordinatorSlug");
  if (!canCreateFor(profile, coordinatorSlug)) deny();

  await createTask({
    id: uid("tsk"),
    coordinatorSlug,
    title: requiredText(formData, "title"),
    status: "pending",
    dueDate: text(formData, "dueDate"),
    source: text(formData, "source"),
    createdByEmail: profile.email,
  });

  revalidateAll();
  redirect(`/coordinadoras/${coordinatorSlug}`);
}

export async function removeRecord(formData: FormData) {
  const profile = await requireInternalProfile("/");
  const table = text(formData, "table") as TableName;
  const id = requiredText(formData, "id");
  if (
    ![
      "documents",
      "minutes",
      "events",
      "activities",
      "tasks",
      "argument_cards",
    ].includes(table)
  ) {
    deny();
  }

  const scope = await getRecordScope(table, id);
  const allowed = Array.isArray(scope)
    ? scope.some((slug) => canManage(profile, slug))
    : canManage(profile, scope);
  if (!allowed) deny();

  await deleteRecord(table, id);
  revalidateAll();
}

async function uploadAttachment(
  formData: FormData,
  recordId: string,
  area: string,
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { name: "", url: "" };
  }
  if (!env.FILES) {
    throw new Error("El almacén de archivos no está disponible.");
  }

  const name = sanitizeFileName(file.name || "adjunto");
  const key = `${area}/${recordId}/${name}`;
  await env.FILES.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });
  return {
    name,
    url: `/api/files/${key}`,
  };
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/documentos");
  revalidatePath("/actas");
  revalidatePath("/calendario");
  revalidatePath("/memoria");
  revalidatePath("/argumentario");
  revalidatePath("/coordinadoras/[slug]", "page");
}

function requiredCoordinator(formData: FormData, key: string) {
  const value = requiredText(formData, key);
  if (!isCoordinatorSlug(value)) deny();
  return value;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) {
    throw new Error(`Falta el campo ${key}.`);
  }
  return value;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 120);
}

function deny(): never {
  throw new Error("No tienes permisos para realizar esta acción.");
}
