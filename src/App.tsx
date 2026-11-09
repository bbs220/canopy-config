import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router";
import { ConfiguratorPage } from "./pages/ConfiguratorPage";
import { ShopifyStorePage } from "./pages/ShopifyStorePage";
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
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
