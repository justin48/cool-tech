import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  json,
  LoaderFunctionArgs,
  redirect,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { db, updateTech } from "#app/utils/db.server.ts";
import { cn, invariantResponse, useIsSubmitting } from "#app/utils/misc.tsx";
import React, { useRef, useState } from "react";
import { floatingToolbarClassName } from "#app/components/floating-toolbar.tsx";
import { Button } from "#app/components/ui/button.tsx";
import { Input } from "#app/components/ui/input.tsx";
import { Label } from "#app/components/ui/label.tsx";
import { Textarea } from "#app/components/ui/textarea.tsx";
import { StatusButton } from "#app/components/ui/status-button.tsx";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { optional, z } from "zod";
import {
  conform,
  FieldConfig,
  list,
  useFieldList,
  useFieldset,
  useForm,
} from "@conform-to/react";
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

const ImageFieldsetSchema = z.object({
  id: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => {
      return file.size <= MAX_UPLOAD_SIZE;
    }, `File size must be less than ${MAX_UPLOAD_SIZE}`)
    .optional(),
  altText: z.string().optional(),
});

const TechEditorSchema = z.object({
  title: z.string().max(titleMaxLength),
  content: z.string().max(contentMaxLength),
  images: z.array(ImageFieldsetSchema),
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

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }

  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  const { title, content, images } = submission.value;

  await updateTech({
    id: params.techId,
    title,
    content,
    images,
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
      images: data.tech.images.length ? data.tech.images : [{}],
    },
  });

  const imageList = useFieldList(form.ref, fields.images);

  return (
    <div className="absolute inset-0">
      <Form
        method="POST"
        className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
        {...form.props}
        encType="multipart/form-data"
      >
        <button type="submit" className="hidden" />
        <div className="flex flex-col gap-1">
          <div>
            <Label htmlFor={fields.title.id}>Title</Label>
            <Input autoFocus {...conform.input(fields.title)} />
            <div className="min-h-[32px] px-4 pb-3 pt-1">
              <ErrorList
                id={fields.title.errorId}
                errors={fields.title.errors}
              />
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
            <Label>Images</Label>
            <ul className="flex flex-col gap-4">
              {imageList.map((image, index) => (
                <li
                  key={image.key}
                  className="relative border-b-2 border-muted-foreground"
                >
                  <button
                    className="text-foreground-destructive absolute right-0 top-0"
                    {...list.remove(fields.images.name, { index })}
                  >
                    <span aria-hidden>❌</span>{" "}
                    <span className="sr-only">Delete image {index + 1}</span>
                  </button>
                  <ImageChooser config={image} />
                </li>
              ))}
            </ul>
          </div>
          <Button
            className="mt-3"
            {...list.insert(fields.images.name, { defaultValue: {} })}
          >
            <span aria-hidden>➕ Image</span>{" "}
            <span className="sr-only">Add image</span>
          </Button>
        </div>

        <ErrorList id={form.id} errors={form.errors} />
      </Form>
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
    </div>
  );
}

function ImageChooser({
  config,
}: {
  config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>;
}) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const fields = useFieldset(ref, config);
  const existingImage = Boolean(fields.id.defaultValue);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingImage ? `/resources/images/${fields.id.defaultValue}` : null,
  );
  const [altText, setAltText] = useState(fields.altText.defaultValue ?? "");

  return (
    <fieldset ref={ref} {...conform.fieldset(config)}>
      <div className="flex gap-3">
        <div className="w-32">
          <div className="relative h-32 w-32">
            <label
              htmlFor={fields.file.id}
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
                <input
                  {...conform.input(fields.id, {
                    type: "hidden",
                  })}
                />
              ) : null}
              <input
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
                accept="image/*"
                {...conform.input(fields.file, {
                  type: "file",
                })}
              />
            </label>
          </div>
          <div className="min-h-[32px] px-4 pb-3 pt-1">
            <ErrorList id={fields.file.errorId} errors={fields.file.errors} />
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor={fields.altText.id}>Alt Text</Label>
          <Textarea
            onChange={(e) => setAltText(e.currentTarget.value)}
            {...conform.textarea(fields.altText)}
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
