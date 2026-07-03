import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/regsiter")({
  beforeLoad: () => {
    throw redirect({ to: "/register", replace: true });
  },
});
