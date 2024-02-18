import os from "node:os";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  MetaFunction,
  useMatches,
  useFetcher,
  useFetchers,
} from "@remix-run/react";
import { json, type LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { SearchBar } from "./components/search-bar.tsx";
import { cssBundleHref } from "@remix-run/css-bundle";
import { Button } from "./components/ui/button.tsx";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { parse } from "@conform-to/zod";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { Toaster, toast as showToast } from "sonner";
import faviconAssetUrl from "./assets/favicon.svg";
import { ErrorList } from "./components/forms.tsx";
import { z } from "zod";
import tailwindStyleSheetUrl from "./styles/tailwind.css";
import { sessionStorage } from "#app/utils/session.server.ts";
import { getEnv } from "#app/utils/env.server.ts";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { honeypot } from "./utils/honeypot.server.ts";
import React, { useEffect } from "react";
import { csrf } from "./utils/csrf.server.ts";
import {
  combineHeaders,
  getUserImgSrc,
  invariantResponse,
} from "#app/utils/misc.tsx";
import { getTheme, setTheme, type Theme } from "./utils/theme.server.ts";
import { useForm } from "@conform-to/react";
import { Icon } from "#app/components/ui/icon.tsx";
import { Spacer } from "#app/components/spacer.tsx";
import { getToast, type Toast } from "./utils/toast.server.ts";
import { prisma } from "#app/utils/db.server.ts";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", type: "image/svg+xml", href: faviconAssetUrl },
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
    cssBundleHref ? { rel: "stylesheet", href: cssBundleHref } : null,
  ].filter(Boolean);
};

export async function loader({ request }: LoaderFunctionArgs) {
  const honeyProps = honeypot.getInputProps();
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
  const { toast, headers: toastHeaders } = await getToast(request);
  const cookieSession = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const userId = cookieSession.get("userId");
  const user = userId
    ? await prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          username: true,
          image: { select: { id: true } },
        },
        where: { id: userId },
      })
    : null;

  return json(
    {
      username: os.userInfo().username,
      user,
      theme: getTheme(request),
      toast,
      ENV: getEnv(),
      csrfToken,
      honeyProps,
    },
    {
      headers: combineHeaders(
        csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null,
        toastHeaders,
      ),
    },
  );
}

const ThemeFormSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  invariantResponse(
    formData.get("intent") === "update-theme",
    "Invalid intent",
    { status: 400 },
  );

  const submission = parse(formData, {
    schema: ThemeFormSchema,
  });
  if (submission.intent !== "submit") {
    return json({ status: "success", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  const { theme } = submission.value;

  const responseInit = {
    headers: { "set-cookie": setTheme(theme) },
  };

  return json({ success: true, submission }, responseInit);
}

export function Document({
  children,
  theme,
  env,
}: {
  children: React.ReactNode;
  theme?: Theme;
  env?: Record<string, string>;
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-full flex-col justify-between bg-background text-foreground">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <Toaster closeButton position="top-center" />
        <ScrollRestoration />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
}

export function App() {
  const data = useLoaderData<typeof loader>();
  const theme = useTheme();
  const user = data.user;
  const matches = useMatches();
  const isOnSearchPage = matches.find((m) => m.id === "routes/users+/index");

  return (
    <Document theme={theme} env={data.ENV}>
      <header className="container px-6 py-4 sm:px-8 sm:py-6">
        <nav className="flex items-center justify-between gap-4 sm:gap-6">
          <Link to="/">
            <div className="font-light">Epic</div>
            <div className="font-bold">Technologies!!</div>
          </Link>
          {isOnSearchPage ? null : (
            <div className="ml-auto max-w-sm flex-1">
              <SearchBar status="idle" />
            </div>
          )}
          <div className="flex items-center gap-10">
            {user ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={`/users/${user.username}`}
                    className="flex items-center gap-2"
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      alt={user.name ?? user.username}
                      src={getUserImgSrc(user.image?.id)}
                    />
                    <span className="hidden text-body-sm font-bold sm:block">
                      {user.name ?? user.username}
                    </span>
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>

      <div className="container flex justify-between">
        <Link to="/">
          <div className="font-light">Epic</div>
          <div className="font-bold">Technologies</div>
        </Link>
        <div className="flex items-center gap-2">
          <p>Built with ⚡️ by {data.username}</p>
          <ThemeSwitch userPreference={theme} />
        </div>
      </div>
      <Spacer size="3xs" />
      {data.toast ? <ShowToast toast={data.toast} /> : null}
    </Document>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();

  return (
    <HoneypotProvider {...data.honeyProps}>
      <AuthenticityTokenProvider token={data.csrfToken}>
        <App />
      </AuthenticityTokenProvider>
    </HoneypotProvider>
  );
}
const themeFetcherKey = "theme-fetcher";

function useTheme() {
  const data = useLoaderData<typeof loader>();
  const themeFetcher = useFetcher<typeof action>({ key: themeFetcherKey });
  const optimisticTheme = themeFetcher?.formData?.get("theme");
  if (optimisticTheme === "light" || optimisticTheme === "dark") {
    return optimisticTheme;
  }
  return data.theme;
}

function ThemeSwitch({ userPreference }: { userPreference?: Theme }) {
  const fetcher = useFetcher<typeof action>({ key: themeFetcherKey });

  const [form] = useForm({
    id: "theme-switch",
    lastSubmission: fetcher.data?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: ThemeFormSchema });
    },
  });

  const mode = userPreference ?? "light";
  const nextMode = mode === "light" ? "dark" : "light";
  const modeLabel = {
    light: (
      <Icon name="sun">
        <span className="sr-only">Light</span>
      </Icon>
    ),
    dark: (
      <Icon name="moon">
        <span className="sr-only">Dark</span>
      </Icon>
    ),
  };

  return (
    <fetcher.Form method="POST" {...form.props}>
      <input type="hidden" name="theme" value={nextMode} />
      <div className="flex gap-2">
        <button
          name="intent"
          value="update-theme"
          type="submit"
          className="flex h-8 w-8 cursor-pointer items-center justify-center"
        >
          {modeLabel[mode]}
        </button>
      </div>
      <ErrorList errors={form.errors} id={form.errorId} />
    </fetcher.Form>
  );
}

function ShowToast({ toast }: { toast: Toast }) {
  const { id, type, title, description } = toast;
  useEffect(() => {
    setTimeout(() => {
      showToast[type](title, { id, description });
    }, 0);
  }, [description, id, title, type]);
  return null;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Epic Tech" },
    {
      name: "Cool Tech Website!",
      content: "An application where cool tech lives",
    },
  ];
};

export function ErrorBoundary() {
  return (
    <Document>
      <div className="flex-1">
        <GeneralErrorBoundary />
      </div>
    </Document>
  );
}
