// Candle aggregation utilities for client-side timeframe conversion

export interface Candle {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    open_time?: string;
}

// Map timeframe to minutes
const TIMEFRAME_MINUTES: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1D': 1440,
};

/**
 * Aggregates a 1-minute candle into the appropriate timeframe bucket
 * @param candle1m - The 1-minute candle to aggregate
 * @param timeframe - Target timeframe (1m, 5m, 15m, 1h, 4h, 1D)
 * @param currentCandles - Existing aggregated candles (sorted by time ASC)
 * @returns Updated candles array with the new data
 */
export function aggregateCandle(
    candle1m: Candle,
    timeframe: string,
    currentCandles: Candle[]
): Candle[] {
    const intervalMinutes = TIMEFRAME_MINUTES[timeframe] || 1;

    // For 1m, no aggregation needed
    if (intervalMinutes === 1) {
        // Find and update or append
        const existingIndex = currentCandles.findIndex(c => c.time === candle1m.time);
        if (existingIndex >= 0) {
            currentCandles[existingIndex] = candle1m;
        } else {
            currentCandles.push(candle1m);
        }
        return currentCandles;
    }

    // Calculate bucket start time (truncate to interval boundary)
    const bucketStartTime = Math.floor(candle1m.time / (intervalMinutes * 60)) * (intervalMinutes * 60);

    // Find existing bucket
    const bucketIndex = currentCandles.findIndex(c => c.time === bucketStartTime);

    if (bucketIndex >= 0) {
        // Update existing bucket
        const bucket = currentCandles[bucketIndex];
        bucket.high = Math.max(bucket.high, candle1m.high);
        bucket.low = Math.min(bucket.low, candle1m.low);
        bucket.close = candle1m.close; // Latest close
        bucket.volume = (bucket.volume || 0) + (candle1m.volume || 0);
    } else {
        // Create new bucket
        currentCandles.push({
            time: bucketStartTime,
            open: candle1m.open,
            high: candle1m.high,
            low: candle1m.low,
            close: candle1m.close,
            volume: candle1m.volume || 0,
        });
    }

    // Keep sorted by time (ascending)
    currentCandles.sort((a, b) => a.time - b.time);

    return currentCandles;
}

/**
 * Aggregates multiple 1m candles into target timeframe
 * @param candles1m - Array of 1-minute candles
 * @param timeframe - Target timeframe
 * @returns Aggregated candles
 */
export function aggregateCandles(candles1m: Candle[], timeframe: string): Candle[] {
    const intervalMinutes = TIMEFRAME_MINUTES[timeframe] || 1;

    // For 1m, return as-is
    if (intervalMinutes === 1) {
        return [...candles1m];
    }

    // Group by bucket
    const buckets = new Map<number, Candle[]>();

    for (const candle of candles1m) {
        const bucketTime = Math.floor(candle.time / (intervalMinutes * 60)) * (intervalMinutes * 60);
        if (!buckets.has(bucketTime)) {
            buckets.set(bucketTime, []);
        }
        buckets.get(bucketTime)!.push(candle);
    }

    // Aggregate each bucket
    const aggregated: Candle[] = [];
    for (const [bucketTime, bucket] of buckets.entries()) {
        if (bucket.length === 0) continue;

        const agg: Candle = {
            time: bucketTime,
            open: bucket[0].open,
            close: bucket[bucket.length - 1].close,
            high: Math.max(...bucket.map(c => c.high)),
            low: Math.min(...bucket.map(c => c.low)),
            volume: bucket.reduce((sum, c) => sum + (c.volume || 0), 0),
        };

        aggregated.push(agg);
    }

    // Sort by time
    return aggregated.sort((a, b) => a.time - b.time);
}
