import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const ORG = "rubentalstra";
const REPO = "librechat-prom-exporter";
const REPO_URL = `https://github.com/${ORG}/${REPO}`;

const config: Config = {
  title: "LibreChat Prometheus Exporter",
  tagline: "Prometheus metrics for your LibreChat MongoDB.",
  favicon: "img/favicon.svg",

  url: `https://${ORG}.github.io`,
  baseUrl: `/${REPO}/`,

  organizationName: ORG,
  projectName: REPO,
  deploymentBranch: "gh-pages",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",

  i18n: { defaultLocale: "en", locales: ["en"] },

  // Stable in 3.10 — namespace localStorage keys against multi-app conflicts.
  storage: { type: "localStorage", namespace: true },

  // Forward-compat: opt into ALL upcoming Docusaurus v4 breaking changes
  // now so the 3.x -> 4.0 upgrade later is a no-op for this site.
  future: {
    v4: true,
    faster: true,
    // Eager git-history reader: one `git log` for the whole repo instead
    // of one per file. Build perf win; becomes the v4 default.
    experimental_vcs: "default-v2",
  },

  // Custom head tags. siteConfig.headTags accepts arbitrary HTML elements
  // since 3.10 — used here to add JSON-LD structured data for richer
  // Google search results.
  headTags: [
    {
      tagName: "link",
      attributes: { rel: "preconnect", href: "https://github.com" },
    },
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: REPO,
        operatingSystem: "Linux",
        applicationCategory: "DeveloperApplication",
        offers: { "@type": "Offer", price: "0" },
        url: `https://${ORG}.github.io/${REPO}/`,
      }),
    },
  ],

  markdown: {
    format: "detect", // .md -> CommonMark, .mdx -> MDX
    mermaid: true,
    hooks: {
      // Throw on any broken markdown link at build time — surfaces stale
      // refs immediately instead of letting them ship to prod. The old
      // top-level `onBrokenMarkdownLinks` is deprecated in 3.10 and
      // removed in v4; this is the v4-ready location.
      onBrokenMarkdownLinks: "throw",
    },
  },

  themes: [
    "@docusaurus/theme-mermaid",
    // Adds a "View on GitHub" button to code blocks whose `reference`
    // prop points at a real source file. Pin lines via #L1-L20 anchors.
    "docusaurus-theme-github-codeblock",
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: `${REPO_URL}/tree/main/website/`,
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          versions: { current: { label: "0.8 (Current)" } },
          lastVersion: "current",
        },
        blog: {
          showReadingTime: true,
          feedOptions: { type: ["rss", "atom"], xslt: true },
          editUrl: `${REPO_URL}/tree/main/website/`,
          blogTitle: "Changelog & news",
          blogDescription: "Release announcements and project updates for librechat-prom-exporter.",
          postsPerPage: "ALL",
        },
        theme: { customCss: "./src/css/custom.css" },
        sitemap: { changefreq: "weekly", priority: 0.5 },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en"],
        indexBlog: true,
        indexDocs: true,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: "img/social-card.png",
    metadata: [
      {
        name: "keywords",
        content: "prometheus, librechat, metrics, exporter, monitoring, mongodb, grafana",
      },
    ],
    colorMode: { defaultMode: "light", respectPrefersColorScheme: true },
    navbar: {
      title: "LibreChat Prom Exporter",
      logo: { alt: "Logo", src: "img/favicon.svg" },
      items: [
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          label: "Docs",
        },
        { to: "/blog", label: "Changelog", position: "left" },
        { type: "docsVersionDropdown", position: "right" },
        {
          href: REPO_URL,
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Introduction", to: "/docs/intro" },
            { label: "Installation", to: "/docs/installation/docker" },
            {
              label: "Reference",
              to: "/docs/reference/environment-variables",
            },
            { label: "Troubleshooting", to: "/docs/guides/troubleshooting" },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Discussions",
              href: `${REPO_URL}/discussions`,
            },
            { label: "Issues", href: `${REPO_URL}/issues` },
            { label: "Security Advisories", href: `${REPO_URL}/security` },
          ],
        },
        {
          title: "More",
          items: [
            // RSS is generated automatically; <link rel="alternate"> tags
            // in <head> let feed readers auto-discover. We deliberately do
            // not link it in the footer because Docusaurus's broken-link
            // checker treats /blog/rss.xml as a missing route.
            { label: "Source", href: REPO_URL },
            {
              label: "Container image",
              href: `${REPO_URL}/pkgs/container/${REPO}`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ruben Talstra. MIT-licensed. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["yaml", "bash", "json", "docker"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
