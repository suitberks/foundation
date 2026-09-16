import { describe, expect, test } from 'bun:test';

import {
  type ExecutionErrorCode,
  type ExecutionResult,
  type MeasuredExecution,
  type RetryExecutionContext,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  captureExecution,
  executionErrors,
  executeWithTimeout,
  measureExecutionTime,
  retryExecution,
  safeExecute,
  waitForRetry,
} from '@/index';

// These tests cover execution recovery, capture, retry, timeout, and measurement behavior;
// They preserve exact public types and cancellation semantics across synchronous and async work;

// == CompileTimeContracts ==============================================

type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

type Assert<Condition extends true> = Condition;

type _MeasuredExecutionContract = Assert<
  IsExact<MeasuredExecution<{ ok: true }>, { result: { ok: true }; executionTime: number }>
>;
type _ExecutionResultContract = Assert<
  IsExact<ExecutionResult<'complete'>, { success: true; data: 'complete' } | { success: false; error: unknown }>
>;
type _ExecutionErrorCodeContract = Assert<
  IsExact<ExecutionErrorCode, 'invalidMaxAttempts' | 'invalidRetryDelay' | 'invalidTimeout' | 'executionTimedOut'>
>;
type _RetryExecutionContextContract = Assert<
  IsExact<RetryExecutionContext, Readonly<{ attempt: number; signal?: AbortSignal }>>
>;

// == ExecutionErrors ===================================================

describe('execution errors', () => {
  test('creates typed policy failures with stable camelCase codes', () => {
    const maxAttemptsError = executionErrors.invalidMaxAttempts();
    const retryDelayError = executionErrors.invalidRetryDelay();
    const timeoutPolicyError = executionErrors.invalidTimeout();

    expect(maxAttemptsError).toBeInstanceOf(RangeError);
    expect(maxAttemptsError.message).toBe('invalidMaxAttempts');
    expect(retryDelayError).toBeInstanceOf(RangeError);
    expect(retryDelayError.message).toBe('invalidRetryDelay');
    expect(timeoutPolicyError).toBeInstanceOf(RangeError);
    expect(timeoutPolicyError.message).toBe('invalidTimeout');
  });

  test('creates a standard timeout exception with its stable camelCase code', () => {
    const timeoutError = executionErrors.executionTimedOut();

    expect(timeoutError).toBeInstanceOf(DOMException);
    expect(timeoutError.name).toBe('TimeoutError');
    expect(timeoutError.message).toBe('executionTimedOut');
  });
});

// == SafeExecution =====================================================

describe('safeExecute', () => {
  test('normalizes synchronous and asynchronous success values to promises', async () => {
    expect(await safeExecute(() => 42)).toBe(42);
    expect(await safeExecute(() => Promise.resolve({ source: 'async' as const }))).toEqual({ source: 'async' });
  });

  test('passes the original failure to a synchronous fallback', async () => {
    const failure = new Error('unavailable');
    let handledFailure: unknown;

    const result = await safeExecute(
      () => {
        throw failure;
      },
      (error) => {
        handledFailure = error;
        return 'fallback' as const;
      }
    );

    expect(handledFailure).toBe(failure);
    expect(result).toBe('fallback');
  });

  test('awaits an asynchronous fallback before resolving', async () => {
    const result = await safeExecute(
      () => Promise.reject(new Error('temporary')),
      async () => {
        await Promise.resolve();
        return { recovered: true } as const;
      }
    );

    expect(result).toEqual({ recovered: true });
  });

  test('rethrows the original failure when no fallback is supplied', async () => {
    const failure = new Error('fatal');
    let thrown: unknown;

    try {
      await safeExecute(() => {
        throw failure;
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(failure);
  });

  test('propagates a fallback failure instead of hiding it', async () => {
    const fallbackFailure = new Error('fallback failed');
    let thrown: unknown;

    try {
      await safeExecute(
        () => {
          throw new Error('primary failed');
        },
        () => {
          throw fallbackFailure;
        }
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(fallbackFailure);
  });
});

// == CapturedExecution =================================================

describe('captureExecution', () => {
  test('captures synchronous and asynchronous success values without changing them', async () => {
    const payload = { source: 'async' as const };

    expect(await captureExecution(() => 42)).toEqual({ success: true, data: 42 });
    expect(await captureExecution(() => Promise.resolve(payload))).toEqual({ success: true, data: payload });
  });

  test('captures the original synchronous and asynchronous failures', async () => {
    const synchronousFailure = new Error('synchronous failure');
    const asynchronousFailure = new Error('asynchronous failure');

    const synchronousResult = await captureExecution(() => {
      throw synchronousFailure;
    });
    const asynchronousResult = await captureExecution(() => Promise.reject(asynchronousFailure));

    expect(synchronousResult).toEqual({ success: false, error: synchronousFailure });
    expect(asynchronousResult).toEqual({ success: false, error: asynchronousFailure });
  });
});

// == RetriedExecution ==================================================

describe('retryExecution', () => {
  test('publishes and applies the shared default attempt count', async () => {
    const attempts: number[] = [];

    const result = await captureExecution(() =>
      retryExecution(({ attempt }) => {
        attempts.push(attempt);
        throw new Error('temporary');
      })
    );

    expect(DEFAULT_RETRY_MAX_ATTEMPTS).toBe(3);
    expect(result.success).toBe(false);
    expect(attempts).toHaveLength(DEFAULT_RETRY_MAX_ATTEMPTS);
  });

  test('exposes a cancellable retry delay without requiring a complete retry policy', async () => {
    const controller = new AbortController();
    const cancellation = new Error('cancelled');
    const waiting = captureExecution(() => waitForRetry(1_000, controller.signal));

    controller.abort(cancellation);

    expect(await waiting).toEqual({ success: false, error: cancellation });
    expect(await waitForRetry(0)).toBeUndefined();
    expect(waitForRetry(-1)).rejects.toThrow('invalidRetryDelay');
  });

  test('retries failures and exposes one-based attempt context until success', async () => {
    const attempts: number[] = [];

    const result = await retryExecution(({ attempt }) => {
      attempts.push(attempt);
      if (attempt < 3) throw new Error(`attempt ${attempt}`);

      return 'complete' as const;
    });

    expect(result).toBe('complete');
    expect(attempts).toEqual([1, 2, 3]);
  });

  test('resolves dynamic delays from the latest failure and completed attempt', async () => {
    const failure = new Error('temporary');
    const resolvedDelays: Array<{ error: unknown; attempt: number }> = [];

    const result = await retryExecution(
      ({ attempt }) => {
        if (attempt === 1) throw failure;
        return 'recovered' as const;
      },
      {
        delayMilliseconds: (error, attempt) => {
          resolvedDelays.push({ error, attempt });
          return 0;
        },
      }
    );

    expect(result).toBe('recovered');
    expect(resolvedDelays).toEqual([{ error: failure, attempt: 1 }]);
  });

  test('preserves the latest failure after exhaustion or rejected retry filtering', async () => {
    const exhaustedFailure = new Error('exhausted');
    const filteredFailure = new Error('filtered');
    let exhaustedFilterCalls = 0;

    const exhausted = await captureExecution(() =>
      retryExecution(() => Promise.reject(exhaustedFailure), {
        maxAttempts: 2,
        shouldRetry: () => {
          exhaustedFilterCalls += 1;
          return true;
        },
      })
    );
    const filtered = await captureExecution(() =>
      retryExecution(() => Promise.reject(filteredFailure), { shouldRetry: () => false })
    );

    expect(exhausted).toEqual({ success: false, error: exhaustedFailure });
    expect(exhaustedFilterCalls).toBe(1);
    expect(filtered).toEqual({ success: false, error: filteredFailure });
  });

  test('cancels a pending retry delay without starting another attempt', async () => {
    const controller = new AbortController();
    const cancellation = new Error('cancelled');
    let attempts = 0;

    const result = await captureExecution(() =>
      retryExecution(
        () => {
          attempts += 1;
          queueMicrotask(() => controller.abort(cancellation));
          throw new Error('temporary');
        },
        { delayMilliseconds: 1_000, signal: controller.signal }
      )
    );

    expect(result).toEqual({ success: false, error: cancellation });
    expect(attempts).toBe(1);
  });

  test('rejects invalid attempt and delay policies before another execution', async () => {
    const execution = () => 'unused';

    expect(retryExecution(execution, { maxAttempts: 0 })).rejects.toThrow('invalidMaxAttempts');
    expect(retryExecution(execution, { delayMilliseconds: -1 })).rejects.toThrow('invalidRetryDelay');
  });

  test('rejects an invalid dynamically resolved delay before starting another attempt', async () => {
    let attempts = 0;

    const execution = retryExecution(
      () => {
        attempts += 1;
        throw new Error('temporary');
      },
      { delayMilliseconds: () => Number.NaN }
    );

    expect(execution).rejects.toThrow('invalidRetryDelay');
    expect(attempts).toBe(1);
  });
});

// == TimeBoundedExecution ==============================================

describe('executeWithTimeout', () => {
  test('preserves a completed result and provides an active cancellation signal', async () => {
    let receivedSignal: AbortSignal | undefined;

    const result = await executeWithTimeout(
      (signal) => {
        receivedSignal = signal;
        return 'complete' as const;
      },
      { timeoutMilliseconds: 100 }
    );

    expect(result).toBe('complete');
    expect(receivedSignal?.aborted).toBe(false);
  });

  test('aborts the execution signal and rejects with a standard timeout reason', async () => {
    let receivedSignal: AbortSignal | undefined;

    const result = await captureExecution(() =>
      executeWithTimeout(
        (signal) => {
          receivedSignal = signal;
          return new Promise<never>(() => undefined);
        },
        { timeoutMilliseconds: 0 }
      )
    );

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error).toBeInstanceOf(DOMException);
      expect((result.error as DOMException).name).toBe('TimeoutError');
      expect((result.error as DOMException).message).toBe('executionTimedOut');
    }
    expect(receivedSignal?.aborted).toBe(true);
  });

  test('preserves caller cancellation and forwards its exact reason', async () => {
    const controller = new AbortController();
    const cancellation = new Error('caller cancelled');

    const pendingResult = captureExecution(() =>
      executeWithTimeout(() => new Promise<never>(() => undefined), {
        timeoutMilliseconds: 1_000,
        signal: controller.signal,
      })
    );

    controller.abort(cancellation);

    expect(await pendingResult).toEqual({ success: false, error: cancellation });
  });

  test('does not start an operation when the caller signal is already aborted', async () => {
    const controller = new AbortController();
    const cancellation = new Error('already cancelled');
    let executed = false;

    controller.abort(cancellation);

    const result = await captureExecution(() =>
      executeWithTimeout(
        () => {
          executed = true;
        },
        { timeoutMilliseconds: 100, signal: controller.signal }
      )
    );

    expect(result).toEqual({ success: false, error: cancellation });
    expect(executed).toBe(false);
  });

  test('rejects invalid timeout durations before starting the execution', async () => {
    let executed = false;

    const result = await captureExecution(() =>
      executeWithTimeout(
        () => {
          executed = true;
        },
        { timeoutMilliseconds: Number.POSITIVE_INFINITY }
      )
    );

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error).toBeInstanceOf(RangeError);
      expect((result.error as RangeError).message).toBe('invalidTimeout');
    }
    expect(executed).toBe(false);
  });
});

// == ExecutionMeasurement =============================================

describe('measureExecutionTime', () => {
  test('measures synchronous executions through the same promise-based result', async () => {
    const measured = await measureExecutionTime(() => 'synchronous' as const);

    expect(measured.result).toBe('synchronous');
    expect(measured.executionTime).toBeGreaterThanOrEqual(0);
  });

  test('preserves the resolved result and reports rounded non-negative milliseconds', async () => {
    const payload = { id: 'result', nested: { retained: true } } as const;
    const measured = await measureExecutionTime(async () => {
      await Promise.resolve();
      return payload;
    });

    expect(measured.result).toBe(payload);

    // ↓ Timing itself is host-dependent; its stable contract is an integer millisecond duration.

    expect(Number.isInteger(measured.executionTime)).toBe(true);
    expect(measured.executionTime).toBeGreaterThanOrEqual(0);
  });

  test('does not replace or wrap a rejected execution error', async () => {
    const failure = new Error('measurement target failed');
    let thrown: unknown;

    try {
      await measureExecutionTime(() => Promise.reject(failure));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(failure);
  });
});
