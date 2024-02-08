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
} from "@remix-run/react";
import { json, type LinksFunction } from "@remix-run/node";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import faviconAssetUrl from "./assets/favicon.svg";
import tailwindStyleSheetUrl from "./styles/tailwind.css";
import { getEnv } from "#app/utils/env.server.ts";
import { GeneralErrorBoundary } from "#app/components/error-boundary.tsx";
import { honeypot } from "./utils/honeypot.server.ts";
import React from "react";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", type: "image/svg+xml", href: faviconAssetUrl },
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
  ];
};

export async function loader() {
  const honeyProps = honeypot.getInputProps();
  return json({ username: os.userInfo().username, ENV: getEnv(), honeyProps });
}

export function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <Document>
      <header className="container mx-auto py-6">
        <nav className="flex justify-between">
          <Link to="/">
            <div className="font-light">Epic</div>
            <div className="font-bold">Technologies!!</div>
          </Link>
        </nav>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>

      <div className="container mx-auto flex justify-between">
        <Link to="/">
          <div className="font-light">Epic</div>
          <div className="font-bold">Technologies</div>
        </Link>
        <p>Built with ⚡️ by {data.username}</p>
      </div>
      <div className="h-5" />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
    </Document>
  );
}

export function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-full flex-col justify-between bg-background text-foreground">
        {children}
        <ScrollRestoration />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();

  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  );
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
      <GeneralErrorBoundary />
    </Document>
  );
}
