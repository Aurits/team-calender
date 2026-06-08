"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Person {
  id: string;
  name: string;
  role: string;
  defaultPlace: string;
  tint: number;
}

interface PeopleCtx {
  people: Person[];
  getPerson: (id: string) => Person | undefined;
  loading: boolean;
}

const Ctx = createContext<PeopleCtx>({ people: [], getPerson: () => undefined, loading: true });

/** Loads the team from the database once and shares it with every page. */
export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((data: Person[]) => setPeople(data))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => {
    const map = new Map(people.map((p) => [p.id, p]));
    return { people, getPerson: (id: string) => map.get(id), loading };
  }, [people, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePeople = () => useContext(Ctx);
