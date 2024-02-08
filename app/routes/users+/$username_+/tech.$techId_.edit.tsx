import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  json,
  LoaderFunctionArgs,
  redirect,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { db, updateTech } from "#app/utils/db.server.ts";
import { cn, invariantResponse, useIsSubmitting } from "#app/utils/misc.tsx";
import React, { useState } from "react";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { Input } from "#app/components/ui/input.tsx";
import { Label } from "#app/components/ui/label.tsx";
import { Textarea } from "#app/components/ui/textarea.tsx";
import { StatusButton } from "#app/components/ui/status-button.tsx";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { optional, z } from "zod";
import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { createMemoryUploadHandler } from "#node_modules/@remix-run/server-runtime/dist/upload/memoryUploadHandler.js";

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

const titleMaxLength = 100;
const contentMaxLength = 10000;

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3;

const TechEditorSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(titleMaxLength),
  content: z
    .string()
    .min(1, { message: "Content is required" })
    .max(contentMaxLength),
  imageId: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => {
      return file.size <= MAX_UPLOAD_SIZE;
    }, "File size must be less than 3MB")
    .optional(),
  altText: z.string().optional(),
});

export async function action({ request, params }: LoaderFunctionArgs) {
  invariantResponse(params.techId, "techId param is required");

  const formData = await parseMultipartFormData(
    request,
    createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
  );

  const submission = parse(formData, {
    schema: TechEditorSchema,
  });

  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  const { title, content, file, imageId, altText } = submission.value;

  await updateTech({
    id: params.techId,
    title,
    content,
    images: [
      {
        file,
        id: imageId,
        altText,
      },
    ],
  });

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
      encType="multipart/form-data"
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
        <div>
          <Label>Image</Label>
          <ImageChooser image={data.tech.images[0]} />
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

function ImageChooser({
  image,
}: {
  image?: { id: string; altText?: string | null };
}) {
  const existingImage = Boolean(image);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingImage ? `/resources/images/${image?.id}` : null,
  );
  const [altText, setAltText] = useState(image?.altText ?? "");

  return (
    <fieldset>
      <div className="flex gap-3">
        <div className="w-32">
          <div className="relative h-32 w-32">
            <label
              htmlFor="image-input"
              className={cn("group absolute h-32 w-32 rounded-lg", {
                "bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100":
                  !previewImage,
                "cursor-pointer focus-within:ring-4": !existingImage,
              })}
            >
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={altText ?? ""}
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                  {existingImage ? null : (
                    <div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
                      new
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
                  ➕
                </div>
              )}
              {existingImage ? (
                <input name="imageId" type="hidden" value={image?.id} />
              ) : null}
              <input
                id="image-input"
                aria-label="Image"
                className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPreviewImage(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setPreviewImage(null);
                  }
                }}
                name="file"
                type="file"
                accept="image/*"
              />
            </label>
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor="alt-text">Alt Text</Label>
          <Textarea
            id="alt-text"
            name="altText"
            defaultValue={altText}
            onChange={(e) => setAltText(e.currentTarget.value)}
          />
        </div>
      </div>
    </fieldset>
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
