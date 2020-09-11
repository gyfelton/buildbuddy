/** Represents a trace event in the profile. */
export interface TraceEvent {
  pid: number;
  tid: number;
  ts: number;
  ph: string;
  cat: string;
  name: string;
  dur: number;
  tdur: number;
  tts: number;
  args: { [key: string]: any };
  id?: string;
}

/** TraceEvent augmented with calculated call stack info. */
export type ThreadEvent = TraceEvent & {
  depth: number;
};

/** A list of all the events and their call stack depths within a named thread. */
export type ThreadTimeline = {
  tid: number;
  threadName: string;
  events: ThreadEvent[];
  maxDepth: number;
};

function eventComparator(a: TraceEvent, b: TraceEvent) {
  const tid = a.tid !== undefined && b.tid !== undefined ? a.tid - b.tid : 0;
  if (tid !== 0) return tid;

  const ts = a.ts !== undefined && b.ts !== undefined ? a.ts - b.ts : 0;
  if (ts !== 0) return ts;

  const dur = a.dur !== undefined && b.dur !== undefined ? a.dur - b.dur : 0;
  if (dur !== 0) return dur;

  return 0;
}

/**
 * Builds the ThreadTimeline structures given the flat list of trace events
 * from the profile.
 */
export function buildThreadTimelines(events: TraceEvent[]): ThreadTimeline[] {
  events.sort(eventComparator);

  const timelines: ThreadTimeline[] = [];
  let tid = null;
  let timeline: ThreadTimeline | null = null;
  let stack: ThreadEvent[] = [];
  const threadNameByTid = new Map<number, string>();
  for (const event of events as ThreadEvent[]) {
    if (event.name === "thread_name") {
      threadNameByTid.set(event.tid, event.args.name);
      continue;
    }

    if (event.tid === undefined || event.dur === undefined || event.ts === undefined) {
      continue;
    }

    if (tid === null || event.tid !== tid) {
      // Encountered new thread
      // (Note that events are sorted by tid first)
      tid = event.tid;
      timeline = {
        tid,
        threadName: "",
        events: [],
        maxDepth: 0,
      };
      timelines.push(timeline);
      stack = [];
    }

    // Traverse up the stack while the current event starts
    // after the current stack frame ends.
    let top = stack[stack.length - 1];
    while (top && top.ts + top.dur <= event.ts) {
      stack.pop();
      top = stack[stack.length - 1];
    }
    event.depth = stack.length;
    timeline.maxDepth = Math.max(event.depth, timeline.maxDepth);
    timeline.events.push(event);
    stack.push(event);
  }

  for (const timeline of timelines) {
    timeline.threadName = threadNameByTid.get(timeline.tid);
  }

  return timelines;
}