const GITHUB_USER = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? "yourusername";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers: HeadersInit = {
  Accept: "application/vnd.github+json",
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

export async function getGitHubStats() {
  const [userRes, eventsRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`, { headers, next: { revalidate: 60 } }),
  ]);

  const user = await userRes.json();
  const events: { type: string; created_at: string; repo: { name: string } }[] = await eventsRes.json();

  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const lastPush = pushEvents[0]?.created_at ?? null;
  const isActiveToday = lastPush
    ? new Date(lastPush).toDateString() === new Date().toDateString()
    : false;

  return {
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    lastPush,
    isActiveToday,
    recentRepos: [...new Set(pushEvents.map((e) => e.repo.name))].slice(0, 5),
  };
}
