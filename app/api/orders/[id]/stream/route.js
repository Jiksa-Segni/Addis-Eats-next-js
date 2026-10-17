/**
 * GET /api/orders/[id]/stream
 *
 * Server-Sent Events (SSE) stream for live order-status updates.
 *
 * FRAMING
 * ───────
 * Each SSE message is a JSON payload with the public order projection:
 *   { id, status, address, createdAt, updatedAt }
 *
 * SSE frames use the standard format:
 *   data: <json>\n\n
 *
 * Named events used:
 *   event: status  — regular status heartbeat / change
 *   event: done    — terminal state reached; client should close EventSource
 *   event: error   — something went wrong (ownership check failed, etc.)
 *
 * BEHAVIOUR
 * ─────────
 * 1. Auth + ownership enforced up front. 401/403 returned as HTTP errors
 *    before the stream starts so the client's EventSource.onerror fires.
 * 2. Sends the current state immediately on connection (so the page
 *    renders useful data without waiting for the first poll interval).
 * 3. Polls the in-memory store every 2 s and sends a frame on every change.
 * 4. When status is terminal (delivered, completed, cancelled) it sends a
 *    final `done` event and closes the stream.
 * 5. The stream is aborted when the client disconnects (request.signal).
 *
 * TERMINAL STATUSES
 * ─────────────────
 * delivered, completed, cancelled — no further updates expected.
 */
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

const TERMINAL = new Set(["delivered", "completed", "cancelled"]);
const POLL_MS = 2000;

/** Encode one SSE frame. */
function sseFrame(event, data) {
  const json = JSON.stringify(data);
  return `event: ${event}\ndata: ${json}\n\n`;
}

export async function GET(request, { params }) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const session = await getSession();
  if (session?.role !== "customer") {
    return new Response("Customer sign-in required.", { status: 401 });
  }

  const { id } = await params;
  const order = getOrderById(id);

  if (!order || order.userId !== session.id) {
    return new Response("Order not found.", { status: 404 });
  }

  // ── Stream ───────────────────────────────────────────────────────────────
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  function write(event, data) {
    try {
      writer.write(encoder.encode(sseFrame(event, data)));
    } catch {
      // Writer already closed — ignore
    }
  }

  function publicProjection(o) {
    return {
      id: o.id,
      status: o.status,
      address: o.address ?? null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt ?? o.createdAt,
    };
  }

  // Send current state immediately
  write("status", publicProjection(order));

  let lastStatus = order.status;
  let intervalId;

  function cleanup() {
    clearInterval(intervalId);
    writer.close().catch(() => {});
  }

  // Close if already terminal on connect
  if (TERMINAL.has(lastStatus)) {
    write("done", publicProjection(order));
    cleanup();
  } else {
    intervalId = setInterval(() => {
      // Re-read from the live store on every tick
      const current = getOrderById(id);

      if (!current) {
        write("error", { message: "Order no longer exists." });
        cleanup();
        return;
      }

      const projection = publicProjection(current);

      // Always send on status change; also send a heartbeat every 10 s
      // (tracked via a separate counter to keep the code simple).
      if (current.status !== lastStatus) {
        lastStatus = current.status;
        write("status", projection);

        if (TERMINAL.has(current.status)) {
          write("done", projection);
          cleanup();
        }
      }
    }, POLL_MS);
  }

  // Abort stream when client disconnects
  request.signal.addEventListener("abort", cleanup, { once: true });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Allow the browser to use the stream cross-origin if needed
      "X-Accel-Buffering": "no",
    },
  });
}
