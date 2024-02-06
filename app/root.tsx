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
} from "@remix-run/react";
import { json, type LinksFunction } from "@remix-run/node";
import faviconAssetUrl from "./assets/favicon.svg";
import tailwindStyleSheetUrl from "./styles/tailwind.css";
import { getEnv } from "#app/utils/env.server.ts";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", type: "image/svg+xml", href: faviconAssetUrl },
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
  ];
};

export async function loader() {
  return json({ username: os.userInfo().username, ENV: getEnv() });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <title>Epic Tech</title>
        <meta
          name="Cool Tech!"
          content="An application to communicate cool tech ideas"
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
      </head>
      <body className="flex h-full flex-col justify-between bg-background text-foreground">
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
          <p>Built with ♥️ by {data.username}</p>
        </div>
        <div className="h-5" />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <LiveReload />
        <Scripts />
      </body>
    </html>
  );
}
