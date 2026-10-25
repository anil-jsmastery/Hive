import Link from "next/link";
import { CommentForm } from "@/components/skill/comment-form";
import { getComments } from "@/lib/queries/skill";
import { timeAgo } from "@/lib/time";

export async function Comments({ skillId, slug, signedIn }: { skillId: string; slug: string; signedIn: boolean }) {
  const comments = await getComments(skillId);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">Comments ({comments.length})</h2>
      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="space-y-1 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                {comment.author ? (
                  <Link href={`/u/${comment.author.handle}`} className="text-sm font-medium hover:underline">
                    @{comment.author.handle}
                  </Link>
                ) : null}
                <span className="text-sm text-muted-foreground">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="max-w-prose text-base leading-relaxed whitespace-pre-line">{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {signedIn ? (
        <CommentForm slug={slug} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href={`/sign-in?redirect_url=/s/${slug}`} className="font-medium text-foreground hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}
    </section>
  );
}
