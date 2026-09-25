// /dashboard/[clientId] — one person's analytics.
//
// getClientDetail() is the authorization boundary: it returns null for
// any user_id this session may not see, which today means anyone but
// yourself. A missing person and a forbidden one both render as 404,
// so the page cannot be used to probe which user_ids exist.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { getClientDetail } from "@/lib/dashboard";
import { getDayMeans } from "@/lib/coach-analytics";
import CoachView from "./coach-view";
import { getLatestActivity } from "@/lib/today-analytics";

export const dynamic = "force-dynamic";

function ago(d: Date | null): string {
  if (!d) return "never";
  const days = Math.round((Date.now() - d.getTime()) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return "over a month ago";
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { clientId } = await params;

  // Permission FIRST, then data. Running them together meant a client
  // you may not see still had their aggregates computed, only to be
  // thrown away — wasted work on data this session has no business
  // touching.
  //
  // Redirect rather than notFound(): the dashboard layout streams the
  // shell before this component runs, so the response status is
  // already committed and notFound() rendered its page under a 200.
  // Sending them to their own roster is unambiguous, and it says the
  // same thing to someone probing for real user_ids as to someone who
  // followed a stale link.
  const client = await getClientDetail(session, clientId);
  if (!client) redirect("/dashboard");

  const dayRows = await getDayMeans(clientId, 90);
  const activity = await getLatestActivity(clientId);

  const isSelf = client.userId === session.userId;

  return (
    <>
      <Link className="back" href={isSelf ? "/dashboard" : "/dashboard/team"}>
        <svg viewBox="0 0 24 24">
          <path d="m14 6-6 6 6 6" />
        </svg>{" "}
        {isSelf ? "Your overview" : "Team members"}
      </Link>

      <CoachView days={dayRows} clientId={client.userId} perspective={isSelf ? "self" : "member"} title={isSelf ? "You" : client.name} summary={`${client.count30} check-ins in the last 30 days. Last one ${ago(client.lastAt)}.`} latestActivity={activity} />

    </>
  );
}
