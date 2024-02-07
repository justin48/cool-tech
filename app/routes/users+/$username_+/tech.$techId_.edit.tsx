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

type ActionErrors = {
  formErrors: Array<string>;
  fieldErrors: {
    title: Array<string>;
    content: Array<string>;
  };
};

const titleMaxLength = 100;
const contentMaxLength = 10000;

export async function action({ request, params }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  invariantResponse(typeof title === "string", "Title must be a string");
  invariantResponse(typeof content === "string", "Content must be a string");

  const errors: ActionErrors = {
    formErrors: [],
    fieldErrors: {
      title: [],
      content: [],
    },
  };

  if (title === "") {
    errors.fieldErrors.title.push("Title is required");
  }
  if (title.length > titleMaxLength) {
    errors.fieldErrors.title.push(
      `Title is too large. Must be ${titleMaxLength} characters or less`,
    );
  }
  if (content === "") {
    errors.fieldErrors.content.push("Content is required");
  }
  if (content.length > contentMaxLength) {
    errors.fieldErrors.content.push(
      `Content is too large. Must be ${contentMaxLength} characters or less`,
    );
  }

  const hasErrors =
    errors.formErrors.length ||
    Object.values(errors.fieldErrors).some((fieldErrors) => fieldErrors.length);
  if (hasErrors) {
    return json({ status: "error", errors } as const, { status: 400 });
  }

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

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export default function TechEdit() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();
  const formRef = useRef<HTMLFormElement>(null);
  const formId = "tech-editor";
  const titleId = useId();
  const contentId = useId();

  const fieldErrors =
    actionData?.status === "error" ? actionData.errors.fieldErrors : null;
  const formErrors =
    actionData?.status === "error" ? actionData.errors.formErrors : null;
  const isHydrated = useHydrated();

  const formHasErrors = Boolean(formErrors?.length);
  const formErrorId = formHasErrors ? "form-error" : undefined;
  const titleHasErrors = Boolean(fieldErrors?.title.length);
  const titleErrorId = titleHasErrors ? "title-error" : undefined;
  const contentHasErrors = Boolean(fieldErrors?.content.length);
  const contentErrorId = contentHasErrors ? "content-error" : undefined;

  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;
    if (actionData?.status !== "error") return;

    if (formEl.matches('[aria-invalid="true"]')) {
      formEl.focus();
    } else {
      const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.focus();
      }
    }
  }, [actionData]);

  return (
    <Form
      id={formId}
      method="POST"
      noValidate={isHydrated}
      className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
      aria-invalid={formHasErrors || undefined}
      aria-describedby={formErrorId}
      ref={formRef}
      tabIndex={-1}
    >
      <div className="flex flex-col gap-1">
        <div>
          <Label htmlFor={titleId}>Title</Label>
          <Input
            id={titleId}
            name="title"
            defaultValue={data.tech.title}
            required
            maxLength={titleMaxLength}
            aria-invalid={titleHasErrors || undefined}
            aria-describedby={titleErrorId}
            autoFocus
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={titleErrorId} errors={fieldErrors?.title} />
          </div>
        </div>
        <div>
          <Label htmlFor={contentId}>Content</Label>
          <Textarea
            id={contentId}
            name="content"
            defaultValue={data.tech.content}
            required
            maxLength={contentMaxLength}
            aria-invalid={contentHasErrors || undefined}
            aria-describedby={contentErrorId}
          />
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={contentErrorId} errors={fieldErrors?.content} />
          </div>
        </div>
      </div>
      <div className={floatingToolbarClassName}>
        <Button form={formId} variant="destructive" type="reset">
          Reset
        </Button>
        <StatusButton
          form={formId}
          type="submit"
          disabled={isSubmitting}
          status={isSubmitting ? "pending" : "idle"}
        >
          Submit
        </StatusButton>
      </div>
      <ErrorList id={formErrorId} errors={formErrors} />
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
