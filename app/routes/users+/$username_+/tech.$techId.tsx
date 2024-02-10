import {
  Form,
  Link,
  MetaFunction,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { db } from "#app/utils/db.server.ts";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { CSRFError } from "remix-utils/csrf/server";
import { Button } from "#app/components/ui/button.tsx";
import { csrf } from "#app/utils/csrf.server.ts";
import { invariantResponse } from "#app/utils/misc.tsx";
import React from "react";
import { type loader as techLoader } from "./tech.tsx";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";

export async function loader({ params }: LoaderFunctionArgs) {
  const tech = db.tech.findFirst({
    where: {
      id: {
        equals: params.techId,
      },
    },
  });

  invariantResponse(tech, "Tech not found", { status: 404 });

  return json({
    tech: {
      title: tech.title,
      content: tech.content,
      images: tech.images.map((i) => ({ id: i.id, altText: i.altText })),
    },
  });
}

export async function action({ request, params }: LoaderFunctionArgs) {
  invariantResponse(params.techId, "TechId param is required");
  const formData = await request.formData();

  try {
    await csrf.validate(formData, request.headers);
  } catch (error) {
    if (error instanceof CSRFError) {
      throw new Response("Invalid CSRF token", { status: 403 });
    }
    throw error;
  }

  const intent = formData.get("intent");
  invariantResponse(intent === "delete", "Invalid intent");
  db.tech.delete({ where: { id: { equals: params.techId } } });

  return redirect(`/users/${params.username}/tech`);
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
              <a href={`/resources/images/${image.id}`}>
                <img
                  src={`/resources/images/${image.id}`}
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
        <Form method="POST">
          {/*<AuthenticityTokenInput />*/}
          <Button
            type="submit"
            variant="destructive"
            name="intent"
            value="delete"
          >
            Delete
          </Button>
        </Form>

        <Button asChild>
          <Link to="edit">Edit</Link>
        </Button>
      </div>
    </div>
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
