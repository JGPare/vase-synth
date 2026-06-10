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
      <table className="w-full text-xs table-fixed">
        <thead>
          <tr className="text-gray-400 text-[10px]">
            <td className="py-1 px-2">Vase Name</td>
            <td className="py-1 px-2 w-20">Creator</td>
            <td className="py-1 px-2 w-10 text-center">Public</td>
            <td className="py-1 px-2 w-16 text-right">Downloads</td>
          </tr>
        </thead>
        <tbody>
          {indexList.map((row, i) => (
            <tr
              key={`${row.name}-${row.user}-${i}`}
              onClick={() => handleRowClick(row)}
              className="cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <td className="py-1 px-2 break-words">{row.name}</td>
              <td className="py-1 px-2 text-gray-400 break-words">{row.user}</td>
              <td className="py-1 px-2 text-center text-purple-400">
                {row.access === 'public' ? '✓' : ''}
              </td>
              <td className="py-1 px-2 text-gray-400 text-right">{row.downloads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
