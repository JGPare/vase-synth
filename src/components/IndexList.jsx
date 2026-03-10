import { useVaseStore } from '../stores/vaseStore'

export default function IndexList({ indexList = [], onClose }) {
  const loadVase = useVaseStore((s) => s.loadVase)

  const handleRowClick = (row) => {
    loadVase(row.name, row.user)
    onClose()
  }

  if (indexList.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-4">No vases found</p>
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs">
            <td className="py-1 px-2">Vase Name</td>
            <td className="py-1 px-2">Creator</td>
            <td className="py-1 px-2">Access</td>
            <td className="py-1 px-2 text-right">Downloads</td>
          </tr>
        </thead>
        <tbody>
          {indexList.map((row, i) => (
            <tr
              key={`${row.name}-${row.user}-${i}`}
              onClick={() => handleRowClick(row)}
              className="cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <td className="py-1 px-2">{row.name}</td>
              <td className="py-1 px-2 text-gray-400">{row.user}</td>
              <td className="py-1 px-2 text-gray-400">{row.access}</td>
              <td className="py-1 px-2 text-gray-400 text-right">{row.downloads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
