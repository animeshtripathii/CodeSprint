import { cn } from "../../lib/utils";
import { initials, colorFromId } from "../../lib/utils";

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

const Avatar = ({ name, id, src, size = "md", className, title }) => (
  <div
    title={title || name}
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-surface",
      sizeMap[size],
      className
    )}
    style={{ backgroundColor: src ? undefined : colorFromId(id || name || "") }}
  >
    {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
  </div>
);

/**
 * AvatarStack — live presence avatars.
 * Normalises _id → id so both Mongoose and plain objects work.
 * Shows a pulsing green dot on the first avatar to indicate "live".
 */
export const AvatarStack = ({ users = [], max = 4, size = "sm" }) => {
  // Normalise: backend may send { _id, name } or { id, name }
  const normalised = users.map((u) => ({
    ...u,
    id: u.id || u._id || u.email || u.name,
    name: u.name || u.email || "User",
    avatar_url: u.avatar_url || u.avatarUrl || null,
  }));

  const shown = normalised.slice(0, max);
  const extra = normalised.length - shown.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((u, i) => (
        <div key={u.id || i} className="relative">
          <Avatar
            id={u.id}
            name={u.name}
            src={u.avatar_url}
            size={size}
            title={`${u.name} — viewing`}
          />
          {/* Live green dot only on the first avatar */}
          {i === 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-surface" />
            </span>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-muted ring-2 ring-surface",
            sizeMap[size]
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

export default Avatar;
