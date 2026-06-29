import { IconLock, IconFlag } from "@tabler/icons-react";

interface ZoneLockedOverlayProps {
  zoneName: string;
  prevZoneName: string;
}

export default function ZoneLockedOverlay({ zoneName, prevZoneName }: ZoneLockedOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        background: "rgba(7,7,13,0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        borderRadius: "0 0 12px 12px",
        gap: 8,
      }}
    >
      <IconLock size={28} color="var(--ts-text-dim, #9b94b3)" />
      <span style={{ fontSize: 13, color: "var(--ts-text-dim, #9b94b3)", fontWeight: 500 }}>
        Complete {prevZoneName} zone to unlock
      </span>
      <div
        style={{
          fontSize: 12,
          color: "var(--ts-text-dim, #9b94b3)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IconFlag size={11} />
        Clear all 100 {prevZoneName} levels
      </div>
    </div>
  );
}
