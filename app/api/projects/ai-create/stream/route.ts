import { z } from "zod";
import {
  streamProjectCreation,
  type AICreateStreamEvent,
} from "@/lib/ai/agents/project-creation-stream";
import { guardOrRespond } from "@/lib/auth/api-guard";

const schema = z.object({
  brief: z.string().min(20, "Please describe your building and renovation goals in at least one sentence."),
});

export async function POST(request: Request) {
  const denied = await guardOrRespond("POST", "/api/projects/ai-create/stream");
  if (denied) return denied;

  let brief: string;

  try {
    const body = await request.json();
    brief = schema.parse(body).brief;
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.errors[0]?.message ?? "Invalid input")
        : "Invalid request";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AICreateStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await streamProjectCreation(brief, send);
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to create project",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
