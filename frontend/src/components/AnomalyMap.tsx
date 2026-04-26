import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import { useTheme } from "@/components/ThemeProvider";
import { riskKeyFromLabel, type Anomaly, type RiskKey } from "@/lib/api";
import { cn } from "@/lib/utils";

// Cache zip → coords across renders/sessions.
const COORD_CACHE_KEY = "epicenter:zipCoords:v1";
type Coords = { lat: number; lng: number };
type CoordCache = Record<string, Coords | null>;

function loadCache(): CoordCache {
  try {
    return JSON.parse(localStorage.getItem(COORD_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(c: CoordCache) {
  try {
    localStorage.setItem(COORD_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

async function fetchZipCoords(zip: string): Promise<Coords | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const j = await r.json();
    const place = j?.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    };
  } catch {
    return null;
  }
}

const RISK_HSL: Record<RiskKey, string> = {
  outbreak: "hsl(var(--risk-outbreak))",
  significant: "hsl(var(--risk-significant))",
  emerging: "hsl(var(--risk-emerging))",
  normal: "hsl(var(--risk-normal))",
  nodata: "hsl(var(--risk-nodata))",
};

// Spread radius in pixels — scaled by anomaly score (0–100).
function radiusForScore(score: number) {
  const s = Math.max(0, Math.min(100, score));
  return 10 + (s / 100) * 28; // 10–38px
}

function FitToMarkers({ points }: { points: Coords[] }) {
  const map = useMap();
  useEffect(() => {
    // Ensure Leaflet recalculates its container size after mount/layout shifts.
    const t = setTimeout(() => {
      map.invalidateSize();
      if (!points.length) {
        map.fitBounds(
          [
            [24.396308, -124.848974],
            [49.384358, -66.885444],
          ],
          { padding: [26, 26] },
        );
      }
    }, 0);
    if (!points.length) return () => clearTimeout(t);
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 7);
      return () => clearTimeout(t);
    }
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 8 },
    );
    return () => clearTimeout(t);
  }, [points, map]);
  return null;
}

export function AnomalyMap({ anomalies }: { anomalies: Anomaly[] }) {
  const { theme } = useTheme();
  const [coords, setCoords] = useState<CoordCache>(() => loadCache());

  // Resolve any missing zips.
  useEffect(() => {
    let cancelled = false;
    const missing = anomalies
      .map((a) => a.zip_code)
      .filter((z) => !(z in coords));
    if (!missing.length) return;

    (async () => {
      const next: CoordCache = { ...coords };
      // Sequential to be polite to the free API.
      for (const zip of missing) {
        const c = await fetchZipCoords(zip);
        next[zip] = c;
      }
      if (cancelled) return;
      setCoords(next);
      saveCache(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [anomalies, coords]);

  const points = useMemo(() => {
    return anomalies
      .map((a) => {
        const c = coords[a.zip_code];
        if (!c) return null;
        return { anomaly: a, ...c };
      })
      .filter(Boolean) as Array<Coords & { anomaly: Anomaly }>;
  }, [anomalies, coords]);

  // CARTO tiles — neutral, theme-appropriate. No attribution surprises.
  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const labelsUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

  const resolved = points.length;
  const total = anomalies.length;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Geographic spread</h2>
          <p className="text-xs text-muted-foreground">
            One marker per ZIP · radius scales with anomaly score
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {resolved}/{total} located
        </div>
      </div>

      <div className="relative h-[460px] w-full">
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          minZoom={3}
          scrollWheelZoom
          className="h-full w-full"
          style={{ background: "hsl(var(--muted))" }}
          attributionControl={false}
        >
          <TileLayer url={tileUrl} />
          <TileLayer url={labelsUrl} />
          {points.map(({ anomaly, lat, lng }) => {
            const key = riskKeyFromLabel(anomaly.label);
            const color = RISK_HSL[key];
            return (
              <CircleMarker
                key={anomaly.zip_code}
                center={[lat, lng]}
                radius={radiusForScore(anomaly.score)}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.28,
                  weight: 1.5,
                  opacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold">ZIP {anomaly.zip_code}</div>
                    <div className="text-[11px] text-muted-foreground">{anomaly.label}</div>
                    <div className="text-[11px]">
                      Score <span className="font-medium">{anomaly.score}</span> · {anomaly.observed_this_week} reports
                    </div>
                    <Link
                      to={`/zip/${anomaly.zip_code}`}
                      className="text-[11px] underline underline-offset-2"
                    >
                      Open detail →
                    </Link>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
          <FitToMarkers points={points.map(({ lat, lng }) => ({ lat, lng }))} />
        </MapContainer>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-md border border-border bg-card/95 px-3 py-2 text-[11px] shadow-sm backdrop-blur">
          <div className="mb-1 font-medium text-foreground">Risk</div>
          <div className="flex flex-col gap-1">
            {(["outbreak", "significant", "emerging", "normal", "nodata"] as RiskKey[]).map((k) => (
              <LegendDot key={k} k={k} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ k }: { k: RiskKey }) {
  const labels: Record<RiskKey, string> = {
    outbreak: "Possible outbreak",
    significant: "Significant",
    emerging: "Emerging",
    normal: "Normal",
    nodata: "No data",
  };
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span
        className={cn("inline-block h-2.5 w-2.5 rounded-full")}
        style={{ background: RISK_HSL[k] }}
      />
      <span>{labels[k]}</span>
    </div>
  );
}
