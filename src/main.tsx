import { createRoot } from "react-dom/client";
import QuickStarter from "./quickstarter";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <QuickStarter
    admin={new URLSearchParams(location.search).has("instructor")}
  />,
);
