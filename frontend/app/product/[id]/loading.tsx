export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-lg bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-10 w-3/4 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-8 w-32 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-12 w-full rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
