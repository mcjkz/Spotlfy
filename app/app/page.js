"use client";

import React, { Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "./components/Loading";

const SpotifyList = lazy(() => import("./components/SpotifyList"));
const PopularData = lazy(() => import("./components/PopularData"));

export default function HomePage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query");

  
  return (
    <Suspense fallback={<Loading />}>
      {queryParam ? <SpotifyList /> : <PopularData />}
    </Suspense>
  );
}
