export function Rosette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        rx="6"
        stroke="currentColor"
        strokeWidth="5"
      />
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        rx="6"
        stroke="currentColor"
        strokeWidth="5"
        transform="rotate(45 50 50)"
      />
    </svg>
  );
}
