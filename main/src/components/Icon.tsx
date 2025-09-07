import React from "react";
import classNames from "classnames";
import { createElement } from "react";

export const icons = {};

interface IconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
  cotainerStyle?: React.CSSProperties;
  motion?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  inline?: boolean;
}

export const Icon = ({
  icon,
  color,
  size = 24,
  className,
  cotainerStyle,
  onClick,
  motion = true,
  inline = false,
  ...rest
}: IconProps) => {
  const baseIconClasses = " flex items-center justify-center cursor-pointer ";
  const baseInlineIconClasses =
    "inline-flex items-center justify-center cursor-pointer";

  if (!icons[icon]) return null;

  const Element = inline ? "span" : "div";

  return (
    <Element
      aria-label={icon}
      style={{
        ...cotainerStyle,
      }}
      className={classNames(
        inline ? baseInlineIconClasses : baseIconClasses,
        motion
          ? "transition-all duration-200 ease-in-out focus:opacity-50 active:opacity-50 active:scale-90"
          : ""
      )}
      onClick={onClick}
      {...rest}
    >
      {createElement(icons[icon], {
        style: {
          width: size.toString(),
        },
        className: className,
      })}
    </Element>
  );
};
