import type { ElementType, ComponentPropsWithoutRef } from "react";

type ContainerProps<T extends ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

export function Container<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: ContainerProps<T>) {
  const Component = as || "div";
  return <Component className={`mx-auto max-w-[1280px] px-8 ${className}`} {...props} />;
}
