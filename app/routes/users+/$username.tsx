import {
  isRouteErrorResponse,
  Link,
  MetaFunction,
  useLoaderData,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { db } from "#app/utils/db.server.ts";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { invariantResponse } from "#app/utils/misc.tsx";
import React from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const user = db.user.findFirst({
    where: {
      username: {
        equals: params.username,
      },
    },
  });

  invariantResponse(user, "User not found", { status: 404 });
  return json({
    user: { name: user.name, username: user.username },
  });
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="container mb-48 mt-36">
      <h1 className="text-h1">{data.user.name ?? data.user.username}</h1>
      <Link to="tech" className="underline" prefetch="intent">
        Technologies!!
      </Link>
    </div>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const displayName = data?.user.name ?? params.username;
  return [
    { title: `${displayName} | Epic Tech!` },
    { content: `Check out ${displayName}'s Epic Profile!!` },
  ];
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No user with the username "{params.username}" exists</p>
        ),
      }}
    />
  );
}
