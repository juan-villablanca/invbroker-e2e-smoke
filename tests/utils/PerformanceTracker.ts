import { test } from '@playwright/test';

export type SectionType = 'HOME' | 'MIS CLIENTES' | 'OPERACIONES' | 'PORTFOLIO' | 'RESEARCH' | 'TESORERIA' | 'OTHER';
export type ClientType = 'Latin Securities' | 'GST' | 'Invera';

export interface PerformanceMetric {
    section: SectionType;
    operation: string;
    duration: number; // milliseconds
    timestamp: string;
    client?: ClientType;
    metadata?: Record<string, any>;
}

/**
 * PerformanceTracker - Utility to measure and record granular performance metrics
 * 
 * Usage:
 * ```typescript
 * const tracker = new PerformanceTracker('dashboard', 'Invera');
 * const endTimer = tracker.startTimer('filter-comitente', { comitenteId: '123' });
 * // ... perform operation ...
 * const metric = endTimer();
 * tracker.recordMetric(metric);
 * ```
 */
export class PerformanceTracker {
    private section: SectionType;
    private client?: ClientType;
    private metrics: PerformanceMetric[] = [];

    constructor(section: SectionType, client?: ClientType) {
        this.section = section;
        this.client = client;
    }

    /**
     * Start a timer for a specific operation
     * @param operation - Name of the operation (e.g., 'initial-load', 'filter-comitente')
     * @param metadata - Optional metadata to attach to the metric
     * @returns Function to call when operation completes, which returns the metric
     */
    startTimer(operation: string, metadata?: Record<string, any>): () => PerformanceMetric {
        const startTime = performance.now();
        const timestamp = new Date().toISOString();

        return (): PerformanceMetric => {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            const metric: PerformanceMetric = {
                section: this.section,
                operation,
                duration,
                timestamp,
                client: this.client,
                metadata
            };

            return metric;
        };
    }

    /**
     * Record a metric (automatically called by test reporter)
     */
    recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        // Attach to Playwright test info so reporter can capture it
        try {
            test.info().attachments.push({
                name: `perf-metric-${metric.operation}`,
                contentType: 'application/json',
                body: Buffer.from(JSON.stringify(metric))
            });
        } catch (e) {
            console.warn('Could not attach metric to test info:', e);
        }

        // Also log to console for visibility
        console.log(`⏱️  [PERF] ${metric.section}/${metric.operation}: ${metric.duration}ms`);
    }

    /**
     * Get all recorded metrics
     */
    getMetrics(): PerformanceMetric[] {
        return this.metrics;
    }

    /**
     * Measure an async operation and automatically record the metric
     */
    async measure<T>(
        operation: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const endTimer = this.startTimer(operation, metadata);
        try {
            const result = await fn();
            const metric = endTimer();
            this.recordMetric(metric);
            return result;
        } catch (error) {
            const metric = endTimer();
            metric.metadata = { ...metric.metadata, error: String(error) };
            this.recordMetric(metric);
            throw error;
        }
    }
}
