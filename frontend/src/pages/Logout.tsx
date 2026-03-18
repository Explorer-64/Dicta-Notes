import { auth } from "app";
import { useEffect } from "react";
import { NoIndexMeta } from "components/NoIndexMeta";

export default function Logout() {
  useEffect(() => {
    auth.signOut();
  }, []);

  // Render noindex meta to ensure this utility page isn't indexed
  return <NoIndexMeta />;
}
