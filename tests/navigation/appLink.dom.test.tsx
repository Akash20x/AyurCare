import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nextLinkSpy = vi.hoisted(() => vi.fn());

vi.mock("next/link", () => ({
  default: ({ children, prefetch, ...props }: { children: React.ReactNode; prefetch?: false | "auto" }) => {
    nextLinkSpy({ prefetch, ...props });
    return <a {...props}>{children}</a>;
  },
}));

import { AppLink } from "@/components/shared/AppLink";

describe("AppLink", () => {
  beforeEach(() => nextLinkSpy.mockClear());

  it("disables prefetch by default while preserving normal link props", () => {
    render(<AppLink href="/explore" className="nav-link" aria-label="Explore doctors">Explore</AppLink>);

    expect(nextLinkSpy).toHaveBeenLastCalledWith(expect.objectContaining({ href: "/explore", prefetch: false }));
    expect(screen.getByRole("link", { name: "Explore doctors" }).getAttribute("class")).toBe("nav-link");
  });

  it("forwards the explicit automatic-prefetch opt-in", () => {
    render(<AppLink href="/specializations" prefetch="auto">Specializations</AppLink>);

    expect(nextLinkSpy).toHaveBeenLastCalledWith(expect.objectContaining({ href: "/specializations", prefetch: "auto" }));
  });
});
