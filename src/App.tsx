import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { ConfiguratorPage } from "./pages/ConfiguratorPage";
import { ShopifyStorePage } from "./pages/ShopifyStorePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Toaster } from "react-hot-toast";

function RootLayout() {
  return (
    <div className="w-full max-w-full min-h-dvh overflow-x-hidden">
      {/* accessible skip link for keyboard and screen reader navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-content focus:rounded-md focus:shadow-lg focus:outline-none focus:text-sm focus:font-semibold"
      >
        Skip to configurator
      </a>
      <Toaster position="top-center" />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <ConfiguratorPage />,
      },
      {
        path: "/embed",
        element: <ConfiguratorPage isEmbed={true} />,
      },
      {
        path: "/shopify-preview",
        element: <ShopifyStorePage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
