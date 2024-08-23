"use client";

import { Provider } from "react-redux";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";

import Sidebar from "@components/layout/Sidebar";
import Toasts from "../components/global/Toasts/Toasts";
import { store } from "../store";

import "@styles/app.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const params = useSearchParams();

  /**
   * Disable dragging links, images, and buttons.
   */
  const disableDrag = () => {
    const elements = ["a", "img", "button"];
    elements.forEach((elementName) => {
      let element = document.getElementsByTagName(elementName);
      for (let i = 0; i < element.length; i++) {
        element[i].setAttribute("draggable", "false");
      }
    });
  };

  useEffect(() => {
    setTimeout(disableDrag, 500);
  }, [pathname, params]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="absolute flex w-full h-full no-select cursor-default">
        <ThemeProvider
          enableSystem={false}
          defaultTheme={"dark"}
          themes={["light", "dark"]}
          attribute={"data-theme"}
          enableColorScheme={false}
        >
          <Provider store={store}>
            <Sidebar />
            <div className="relative h-full w-full">{children}</div>
            <Toasts />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
