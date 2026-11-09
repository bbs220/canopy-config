import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { ConfiguratorPage } from "./pages/ConfiguratorPage";
import { ShopifyStorePage } from "./pages/ShopifyStorePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Toaster } from "react-hot-toast";

function RootLayout() {
  return (
    <>
      <Toaster position="top-center" />
      <Outlet />
    </>
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
