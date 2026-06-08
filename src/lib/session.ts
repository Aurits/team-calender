"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PKEY = "cadence:person";

export function loadPerson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PKEY);
}
export function savePerson(id: string) {
  localStorage.setItem(PKEY, id);
}
export function clearPerson() {
  localStorage.removeItem(PKEY);
}

/** undefined = still loading, null = signed out, string = signed in */
export function useSession() {
  const [personId, setPersonId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setPersonId(loadPerson());
  }, []);
  const set = (id: string | null) => {
    if (id) savePerson(id);
    else clearPerson();
    setPersonId(id);
  };
  return { personId, setPersonId: set };
}

/** Guards a page: redirects to the PIN screen when signed out. */
export function useRequirePerson(): string | undefined {
  const router = useRouter();
  const [personId, setPersonId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const id = loadPerson();
    if (!id) router.replace("/");
    else setPersonId(id);
  }, [router]);
  return personId;
}
