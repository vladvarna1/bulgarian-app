export function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 opacity-70">Скоро здесь будет контент.</p>
    </div>
  )
}
