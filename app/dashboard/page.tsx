import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { getClientDetail } from "@/lib/dashboard";
import { getDayMeans } from "@/lib/coach-analytics";
import CoachView from "./[clientId]/coach-view";
import { getLatestActivity } from "@/lib/today-analytics";

export const dynamic = "force-dynamic";

function ago(date: Date | null): string {
  if (!date) return "never";
  const days = Math.round((Date.now() - date.getTime()) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return "over a month ago";
}

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");
  const person = await getClientDetail(session, session.userId);
  if (!person) redirect("/login");
  const days = await getDayMeans(session.userId, 90);
  const activity = await getLatestActivity(session.userId);

  return <>
    <CoachView days={days} clientId={session.userId} perspective="self" title="You" summary={`${person.count30} check-ins in the last 30 days. Last one ${ago(person.lastAt)}.`} latestActivity={activity} />
  </>;
}
