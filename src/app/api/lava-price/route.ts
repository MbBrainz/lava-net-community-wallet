// API route to fetch LAVA token price from FreeCryptoAPI
// Uses Next.js route-level caching to reuse results for 1 hour

import { NextResponse } from "next/server";

export const revalidate = 3600; // seconds (1 hour)

// FreeCryptoAPI response shape
interface FreeCryptoAPIResponse {
  status: string;
  symbols: Array<{
    symbol: string;
    last: string;
    last_btc: string;
    lowest: string;
    highest: string;
    date: string;
    daily_change_percentage: string;
    source_exchange: string;
  }>;
}

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
      "https://api.freecryptoapi.com/v1/getData?symbol=LAVA",
      {
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${apiKey}`,
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

    const data: FreeCryptoAPIResponse = await res.json();

    if (data.status !== "success" || !data.symbols?.[0]) {
      console.error("[lava-price] Unexpected response format:", data);
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    const lavaData = data.symbols[0];
    const price = parseFloat(lavaData.last);

    if (isNaN(price)) {
      console.error("[lava-price] Invalid price value:", lavaData.last);
      return NextResponse.json(
        { error: "Invalid price data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      price,
      currency: "USD",
      symbol: "LAVA",
      timestamp: Date.now(),
      dailyChange: parseFloat(lavaData.daily_change_percentage) || 0,
      high24h: parseFloat(lavaData.highest) || null,
      low24h: parseFloat(lavaData.lowest) || null,
    });
  } catch (error) {
    console.error("[lava-price] Error fetching price:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

