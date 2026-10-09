import React from "react";
import { useIsDesktop } from "../../hooks/useViewport";

interface AdaptiveViewProps {
  /** Presentation rendered for viewports <= 767px */
  mobile: React.ReactNode;
  /** Presentation rendered for viewports >= 768px */
  desktop: React.ReactNode;
}

/**
 * Renders the mobile presentation (<= 767px) or desktop presentation (>= 768px).
 * Only the active interface is mounted.
 */
export const AdaptiveView: React.FC<AdaptiveViewProps> = ({ mobile, desktop }) => {
  const isDesktop = useIsDesktop();
  return <>{isDesktop ? desktop : mobile}</>;
};

export default AdaptiveView;
