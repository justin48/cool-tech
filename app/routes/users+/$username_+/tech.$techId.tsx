import { Form, Link, useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { db } from "#app/utils/db.server.ts";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { invariantResponse } from "#app/utils/misc.tsx";
import React from "react";

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

export async function action({ request, params }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  invariantResponse(intent === "delete", "Invalid Intend");

  db.tech.delete({ where: { id: { equals: params.techId } } });

  return redirect(`/users/${params.username}/tech`);
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
      <div className={floatingToolbarClassName}>
        <Form method="POST">
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