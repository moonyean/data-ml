import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { InputForm } from "./pages/InputForm";
import { ResultsDashboard } from "./pages/ResultsDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/input",
    Component: InputForm,
  },
  {
    path: "/results",
    Component: ResultsDashboard,
  },
]);
