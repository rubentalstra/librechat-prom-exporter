import { JSX } from "react";
import { Redirect } from "@docusaurus/router";
import useBaseUrl from "@docusaurus/useBaseUrl";

export default function Home(): JSX.Element {
  // The docs site has no marketing landing page — the introduction
  // page IS the landing. Redirect / → /docs/intro.
  return <Redirect to={useBaseUrl("/docs/intro")} />;
}
