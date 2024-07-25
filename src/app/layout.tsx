import type { Metadata } from "next";
import "../index.css";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  icons: {
    icon: "icon.png",
  },
  title: "CMU Maps Graph Visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script>const global = globalThis;</script>
      </head>
      <body className="bg-gray-100">
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
