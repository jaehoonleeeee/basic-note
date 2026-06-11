import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@plus-experience/design-system/ui/card";
import { Badge } from "@plus-experience/design-system/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@plus-experience/design-system/ui/table";
import { notFound } from "next/navigation";
import { isAuthed } from "./actions";
import { Gate } from "./gate";
import { Controls } from "./controls";
import { loadTracking, type InstallerStatus } from "./lib";

// Origin-only: reaches GitHub + each installer's /api/version on every render.
// Never cached, never prerendered.
export const dynamic = "force-dynamic";

const STATUS_META: Record<
  InstallerStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; note: string }
> = {
  "up-to-date": { label: "최신", variant: "default", note: "코드·라이브 모두 최신" },
  "live-stale": {
    label: "라이브 구버전",
    variant: "secondary",
    note: "코드는 받았으나 라이브 미반영 — Promote 필요 / 빌드중",
  },
  unreachable: {
    label: "응답 없음",
    variant: "outline",
    note: "도메인 등록됨, /api/version 도달 실패",
  },
  "no-domain": {
    label: "코드 최신",
    variant: "secondary",
    note: "코드는 최신 · 라이브 미확인 (도메인 미등록)",
  },
  "code-behind": {
    label: "동기화 멈춤",
    variant: "destructive",
    note: "fork가 origin보다 뒤처짐 — Pull 미설치 / 동기화 정지 의심",
  },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const short = (sha: string | null) => (sha ? sha.slice(0, 7) : "—");

export default async function AdminPage() {
  // Fork protection: installer deploys lack ADMIN_PASSWORD, so /admin 404s for
  // them — the route's existence is never even revealed. Only the origin deploy
  // (where the env is set) gets the gate + dashboard.
  if (!process.env.ADMIN_PASSWORD) notFound();
  if (!(await isAuthed())) return <Gate />;

  const data = await loadTracking();

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">설치자 배포 트래킹</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            기준(origin):{" "}
            <span className="font-mono text-foreground">v{data.originSemver}</span>
            {data.originSha ? (
              <span className="font-mono"> · {short(data.originSha)}</span>
            ) : null}
          </p>
        </div>
        <Controls />
      </div>

      {data.error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              데이터를 불러오지 못했습니다: {data.error}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="tracking-tight">설치자 {data.rows.length}명</CardTitle>
            <CardDescription>
              코드(fork) 동기화 + 라이브 semver를 함께 추적합니다. 라이브 확인은
              도메인 등록 시에만 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>설치자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>라이브</TableHead>
                  <TableHead>마지막 동기화</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <TableRow key={`${r.owner}/${r.repo}`}>
                      <TableCell>
                        <div className="font-medium">{r.owner}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.repo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {meta.note}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.aheadBy === null ? (
                          <span className="text-muted-foreground">확인불가</span>
                        ) : r.aheadBy === 0 ? (
                          <span className="text-muted-foreground">최신</span>
                        ) : (
                          <span className="text-destructive">
                            {r.aheadBy}커밋 뒤
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.domain ? (
                          r.liveSemver ? (
                            <>
                              <span className="font-mono">v{r.liveSemver}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {" "}
                                · {short(r.liveSha)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">응답없음</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(r.pushedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
