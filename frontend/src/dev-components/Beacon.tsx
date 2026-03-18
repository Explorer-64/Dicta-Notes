import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Dev component for message emission (stub implementation)
 */
export const MessageEmitter = ({ children }: Props) => {
  return <>{children}</>;
};
