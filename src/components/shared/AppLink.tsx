import NextLink from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

export type AppLinkProps = Omit<ComponentPropsWithoutRef<typeof NextLink>, "prefetch"> & {
  prefetch?: false | "auto";
};

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ prefetch = false, ...props }, ref) => <NextLink ref={ref} prefetch={prefetch} {...props} />,
);

AppLink.displayName = "AppLink";
