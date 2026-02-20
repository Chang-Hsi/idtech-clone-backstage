import { PencilSquareIcon } from '@heroicons/react/24/outline'

const PlaceholderPage = ({ title, description }) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <PencilSquareIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </section>
  )
}

export default PlaceholderPage
