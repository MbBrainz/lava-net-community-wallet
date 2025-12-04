// API route to fetch LAVA token price from FreeCryptoAPI
// Uses Next.js route-level caching to reuse results for 1 hour

import { NextResponse } from "next/server";

export const revalidate = 3600; // seconds (1 hour)

export async function GET() {
  const apiKey = process.env.FREECRYPTOAPI_KEY;

  if (!apiKey) {
    console.error("[lava-price] FREECRYPTOAPI_KEY not configured");
    return NextResponse.json(
      { error: "Price API not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      "https://api.freecryptoapi.com/v1/getDataCurrency?symbol=LAVA&currency=USD",
      {
        headers: {
          "X-API-KEY": apiKey,
        },
        // Let Next cache this response for `revalidate` seconds
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error("[lava-price] API request failed:", res.status, res.statusText);
      return NextResponse.json(
        { error: "Failed to fetch LAVA price" },
        { status: 502 }
      );
    }

    const data = await res.json();
    
    // FreeCryptoAPI response shape - adapt if needed
    const price = data.price ?? data.data?.price;

    if (typeof price !== "number") {
      console.error("[lava-price] Unexpected response format:", data);
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    console.log("[lava-price] Fetched price:", price);

    return NextResponse.json({ 
      price,
      currency: "USD",
      symbol: "LAVA",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[lava-price] Error fetching price:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

