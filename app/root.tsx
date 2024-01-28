import os from "node:os";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  useLoaderData,
} from "@remix-run/react";
import { json, type LinksFunction } from "@remix-run/node";
import faviconAssetUrl from "./assets/favicon.svg";
import tailwindStyleSheetUrl from "./styles/tailwind.css";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", type: "image/svg+xml", href: faviconAssetUrl },
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
  ];
};

export async function loader() {
  return json({ username: os.userInfo().username });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html>
      <head>
        <Links />
      </head>
      <body>
        <LiveReload />
        <h1 className="p-8 text-x1">sweet!!!</h1>
        <p>sdfsd</p>
        <p>Built with ♥️ by {data.username}</p>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
