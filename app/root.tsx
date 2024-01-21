import { Links, Meta, Outlet, Scripts } from "@remix-run/react";
import { LinksFunction } from "@remix-run/node";
import faviconAssetUrl from './assets/favicon.svg';

export const links: LinksFunction = () => {
  return [{ rel: "icon", type: "image/svg+xml", href: faviconAssetUrl }];
};

export default function App() {
  return (
    <html>
      <head>
        <Links/>
      </head>
      <body>
        <h1>Technologies that are cool to learn.</h1>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
