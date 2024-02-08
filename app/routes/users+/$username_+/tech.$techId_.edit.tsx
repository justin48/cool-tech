import {
  Form,
  useActionData,
  useFormAction,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { db, updateTech } from "#app/utils/db.server.ts";
import { invariantResponse, useIsSubmitting } from "#app/utils/misc.tsx";
import React, { useEffect, useId, useRef, useState } from "react";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { Input } from "#app/components/ui/input.tsx";
import { Label } from "#app/components/ui/label.tsx";
import { Textarea } from "#app/components/ui/textarea.tsx";
import { StatusButton } from "#app/components/ui/status-button.tsx";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { err } from "#node_modules/@remix-run/dev/dist/result.js";
import { z } from "zod";
import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";

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

const titleMaxLength = 100;
const contentMaxLength = 10000;

const TechEditorSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(titleMaxLength),
  content: z
    .string()
    .min(1, { message: "Content is required" })
    .max(contentMaxLength),
});

export async function action({ request, params }: LoaderFunctionArgs) {
  invariantResponse(params.techId, "techId param is required");

  const formData = await request.formData();

  const submission = parse(formData, {
    schema: TechEditorSchema,
  });

  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  const { title, content } = submission.value;

  await updateTech({ id: params.techId, title, content });

  return redirect(`/users/${params.username}/tech/${params.techId}`);
}

function ErrorList({
  id,
  errors,
}: {
  id?: string;
  errors?: Array<string> | null;
}) {
  return errors?.length ? (
    <ul id={id} className="flex flex-col gap-1">
      {errors.map((error, i) => (
        <li key={i} className="text-[10px] text-foreground-destructive">
          {error}
        </li>
      ))}
    </ul>
  ) : null;
}

export default function TechEdit() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();

  const titleId = useId();
  const contentId = useId();

  const fieldErrors =
    actionData?.status === "error" ? actionData.submission.error : null;
  const formErrors =
    actionData?.status === "error" ? actionData.submission.error[""] : null;

  const [form, fields] = useForm({
    id: "tech-editor",
    constraint: getFieldsetConstraint(TechEditorSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: TechEditorSchema });
    },
    defaultValue: {
      title: data.tech.title,
      content: data.tech.content,
    },
  });

  return (
    <Form
      method="POST"
      className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
      {...form.props}
    >
      <div className="flex flex-col gap-1">
        <div>
          <Label htmlFor={fields.title.id}>Title</Label>
          <Input autoFocus {...conform.input(fields.title)} />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={fields.title.errorId} errors={fields.title.errors} />
          </div>
        </div>
        <div>
          <Label htmlFor={fields.content.id}>Content</Label>
          <Textarea {...conform.textarea(fields.content)} />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList
              id={fields.content.errorId}
              errors={fields.content.errors}
            />
          </div>
        </div>
      </div>
      <div className={floatingToolbarClassName}>
        <Button form={form.id} variant="destructive" type="reset">
          Reset
        </Button>
        <StatusButton
          form={form.id}
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? "pending" : "idle"}
        >
          Submit
        </StatusButton>
      </div>
      <ErrorList id={form.id} errors={form.errors} />
    </Form>
  );
}

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
