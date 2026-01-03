export default function DecorativeLines({ title }: { title: string }) {
  return (
    <div className="relative">
      {/* Line 1 */}
      <div className="absolute top-0 right-0 left-0 flex items-center">
        <div className="h-0.5 w-4/6 bg-gray-400/40"></div>
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-400/40"></div>
      </div>

      {/* Center text */}
      <div className="relative z-10 mt-2 py-8 text-center">
        <h1 className="text-4xl font-semibold font-kufam text-foreground">{title}</h1>
      </div>

      {/* Line 2 */}
      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-end">
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-400/40"></div>
        <div className="h-0.5 w-4/6 bg-gray-400/40"></div>
      </div>
    </div>
  );
}
