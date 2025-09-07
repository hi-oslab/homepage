"use client";

import { useState, useEffect, useRef } from "react";

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

    setIsMobile(mobileRegex.test(userAgent));
  }, []);

  return isMobile;
};

interface ComponentSize {
  width: number;
  height: number;
}

export const useComponentSize = (): [
  React.RefObject<HTMLDivElement>,
  ComponentSize,
] => {
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const { width, height } =
        componentRef.current?.getBoundingClientRect() ?? {
          width: 0,
          height: 0,
        };
      setSize({ width, height });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return [componentRef, size];
};
