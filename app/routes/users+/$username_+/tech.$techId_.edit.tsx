import {
  Form,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { db } from "#app/utils/db.server.ts";
import { invariantResponse } from "#app/utils/misc.tsx";
import React from "react";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { Input } from "#app/components/ui/input.tsx";
import { Label } from "#app/components/ui/label.tsx";
import { Textarea } from "#app/components/ui/textarea.tsx";
import { StatusButton } from "#app/components/ui/status-button.tsx";

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
  const title = formData.get("title");
  const content = formData.get("content");
  invariantResponse(typeof title === "string", "Title must be a string");
  invariantResponse(typeof content === "string", "Content must be a string");

  db.tech.update({
    where: { id: { equals: params.techId } },
    data: { title, content },
  });

  return redirect(`/users/${params.username}/tech/${params.techId}`);
}

export default function TechEdit() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const formAction = useFormAction();
  const isSubmitting =
    navigation.state !== "idle" &&
    navigation.formMethod === "POST" &&
    navigation.formAction === formAction;

  return (
    <Form
      method="POST"
      className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
    >
      <div className="flex flex-col gap-1">
        <div>
          <Label>Title</Label>
          <Input name="title" defaultValue={data.tech.title} />
        </div>
        <div>
          <Label>Content</Label>
          <Textarea name="content" defaultValue={data.tech.content} />
        </div>
      </div>
      <div className={floatingToolbarClassName}>
        <Button variant="destructive" type="reset">
          Reset
        </Button>
        <StatusButton
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? "pending" : "idle"}
        >
          Submit
        </StatusButton>
      </div>
    </Form>
  );
}
