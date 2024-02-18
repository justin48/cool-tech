import {
  Form,
  Link,
  MetaFunction,
  useActionData,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "#app/utils/db.server.ts";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { CSRFError } from "remix-utils/csrf/server";
import { formatDistanceToNow } from "date-fns";
import { Button } from "#app/components/ui/button.tsx";
import { csrf } from "#app/utils/csrf.server.ts";
import {
  getTechImgSrc,
  invariantResponse,
  useIsPending,
} from "#app/utils/misc.tsx";
import React from "react";
import { z } from "zod";
import { type loader as techLoader } from "./tech.tsx";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { redirectWithToast } from "#app/utils/toast.server.ts";
import { useForm } from "@conform-to/react";
import { StatusButton } from "#app/components/ui/status-button.tsx";
import { Icon } from "#app/components/ui/icon.tsx";
import { ErrorList } from "#app/components/forms.tsx";

export async function loader({ params }: LoaderFunctionArgs) {
  const tech = await prisma.tech.findUnique({
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
      updatedAt: true,
      images: {
        select: { id: true, altText: true },
      },
    },
    where: {
      id: params.techId,
    },
  });

  invariantResponse(tech, "Tech not found", { status: 404 });

  const date = new Date(tech.updatedAt);
  const timeAgo = formatDistanceToNow(date);

  return json({ tech, timeAgo });
}

const DeleteFormSchema = z.object({
  intent: z.literal("delete-tech"),
  techId: z.string(),
});

export async function action({ request, params }: LoaderFunctionArgs) {
  invariantResponse(params.techId, "TechId param is required");
  const formData = await request.formData();

  // this isn't working right now.... Fix it later
  // try {
  //   await csrf.validate(formData, request.headers);
  // } catch (error) {
  //   if (error instanceof CSRFError) {
  //     throw new Response("Invalid CSRF token", { status: 403 });
  //   }
  //   throw error;
  // }

  const submission = parse(formData, {
    schema: DeleteFormSchema,
  });
  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  const { techId } = submission.value;

  const tech = await prisma.tech.findFirst({
    select: { id: true, owner: { select: { username: true } } },
    where: { id: techId, owner: { username: params.username } },
  });
  invariantResponse(tech, "Not found", { status: 404 });
  await prisma.tech.delete({ where: { id: tech.id } });

  throw await redirectWithToast(`/users/${tech.owner.username}/tech`, {
    type: "success",
    title: "Success",
    description: "Your Tech has been deleted!!",
  });
}

export default function TechRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="absolute inset-0 flex flex-col px-10">
      <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.tech.title}</h2>
      <div className="overflow-y-auto pb-24">
        <ul className="flex flex-wrap gap-5 py-5">
          {data.tech.images.map((image) => (
            <li key={image.id}>
              <a href={getTechImgSrc(image.id)}>
                <img
                  src={getTechImgSrc(image.id)}
                  alt={image.altText ?? ""}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
        <p className="whitespace-break-spaces text-sm md:text-lg">
          {data.tech.content}
        </p>
      </div>
      <div className={floatingToolbarClassName}>
        <span className="text-sm text-foreground/90 max-[524px]:hidden">
          <Icon name="clock" className="scale-125">
            {data.timeAgo} ago
          </Icon>
        </span>
        <div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
          <DeleteTech id={data.tech.id} />
        </div>

        <Button
          asChild
          className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
        >
          <Link to="edit">
            <Icon name="pencil-1" className="scale-125 max-md:scale-150">
              <span className="max-md:hidden">Edit</span>
            </Icon>
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function DeleteTech({ id }: { id: string }) {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [form] = useForm({
    id: "delete-tech",
    lastSubmission: actionData?.submission,
    constraint: getFieldsetConstraint(DeleteFormSchema),
    onValidate({ formData }) {
      return parse(formData, { schema: DeleteFormSchema });
    },
  });

  return (
    <Form method="post" {...form.props}>
      <AuthenticityTokenInput />
      <input type="hidden" name="techId" value={id} />
      <StatusButton
        type="submit"
        name="intent"
        value="delete-tech"
        variant="destructive"
        status={isPending ? "pending" : actionData?.status ?? "idle"}
        disabled={isPending}
        className="w-full max-md:aspect-square max-md:px-0"
      >
        <Icon name="trash" className="scale-125 max-md:scale-150">
          <span className="max-md:hidden">Delete</span>
        </Icon>
      </StatusButton>
      <ErrorList errors={form.errors} id={form.errorId} />
    </Form>
  );
}

export const meta: MetaFunction<
  typeof loader,
  { "routes/users+/$username_+/tech": typeof techLoader }
> = ({ data, params, matches }) => {
  const techMatch = matches.find(
    (m) => m.id === "routes/users+/$username_+/tech",
  );
  const displayName = techMatch?.data?.owner.name ?? params.username;
  const techTitle = data?.tech.title ?? "Tech";
  const techContentsSummary =
    data && data.tech.content.length > 100
      ? data?.tech.content.slice(0, 97) + "..."
      : "No content";
  return [
    { title: `${techTitle} | ${displayName}'s Technology | Epic Tech!` },
    {
      name: "description",
      content: techContentsSummary,
    },
  ];
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No technology with the identifier "{params.techId}" exists</p>
        ),
      }}
    />
  );
}
