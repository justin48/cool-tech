import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { cn, invariantResponse } from "#app/utils/misc.tsx";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "#app/utils/db.server.ts";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import React from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const owner = await prisma.user.findUnique({
    select: {
      name: true,
      username: true,
      image: { select: { id: true } },
      tech: { select: { id: true, title: true } },
    },
    where: { username: params.username },
  });

  invariantResponse(owner, "Owner not found", { status: 404 });

  return json({ owner });
}

export default function TechRoute() {
  const data = useLoaderData<typeof loader>();
  const ownerDisplayName = data.owner.name ?? data.owner.username;
  const navLinkDefaultClassName =
    "line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl";
  return (
    <main className="container flex h-full min-h-[400px] pb-12 px-0 md:px-8">
      <div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:mx-2 md:rounded-3xl md:pr-0">
        <div className="relative col-span-1">
          <div className="absolute inset-0 flex flex-col">
            <Link to=".." relative="path" className="pb-4 pl-8 pr-4 pt-12">
              <h1 className="text-base font-bold md:text-lg lg:text-left lg:text-2xl">
                {ownerDisplayName}'s Technology
              </h1>
            </Link>
            <ul className="overflow-y-auto overflow-x-hidden pb-12">
              {data.owner.tech.map((tech) => (
                <li key={tech.id} className="p-1 pr-0">
                  <NavLink
                    to={tech.id}
                    preventScrollReset
                    prefetch="intent"
                    className={({ isActive }) =>
                      cn(navLinkDefaultClassName, isActive && "bg-accent")
                    }
                  >
                    {tech.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative col-span-3 bg-accent md:rounded-r-3xl">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>
            No technology owner with the identifier "{params.techId}" exists
          </p>
        ),
      }}
    />
  );
}
