import { MetaFunction } from "@remix-run/react";
import { type loader as techLoader } from "./tech.tsx";

export default function TechnologyIndexRoute() {
  return (
    <div className="container pt-12">
      <p className="text-body-md">Select a technology!</p>
    </div>
  );
}

export const meta: MetaFunction<
  null,
  { "routes/users+/$username_+/tech": typeof techLoader }
> = ({ params, matches }) => {
  const techMatch = matches.find(
    (m) => m.id === "routes/users+/$username_+/tech",
  );
  const displayName = techMatch?.data?.owner.name ?? params.username;
  const techCount = techMatch?.data?.tech.length ?? 0;
  const techText = techCount === 1 ? "tech" : "technologies";
  return [
    { title: `${displayName}'s Technology | Epic Tech` },
    {
      name: "description",
      content: `Checkout ${displayName}'s ${techCount} ${techText} on Epic Technology`,
    },
  ];
};
