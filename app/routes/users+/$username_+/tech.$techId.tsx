import { useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { db } from "#app/utils/db.server.ts";
import { invariantResponse } from "#app/utils/misc.tsx";

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
    tech: { title: tech.title, content: tech.content },
  });
}

export default function SomeTechId() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="absolute inset-0 flex flex-col px-10">
      <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.tech.title}</h2>
      <div className="overflow-y-auto pb-24">
        <p className="whitespace-break-spaces text-sm md:text-lg">
          {data.tech.content}
        </p>
      </div>
    </div>
  );
}
