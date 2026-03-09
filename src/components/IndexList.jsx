import { useState } from 'react'
import { useVaseStore } from '../stores/vaseStore'

export default function IndexList({ indexList = [], onClose }) {
  const [startRow, setStartRow] = useState(0)
  const displayNum = 10
  const loadVase = useVaseStore((s) => s.loadVase)

  const endRow = Math.min(startRow + displayNum, indexList.length)

  const handleRowClick = (row) => {
    loadVase(row.name, row.user)
    onClose()
  }

  return (
    <div className="space-y-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs">
            <td className="py-1 px-2">Vase Name</td>
            <td className="py-1 px-2">Creator</td>
            <td className="py-1 px-2 text-right">Downloads</td>
          </tr>
        </thead>
        <tbody>
          {startRow > 0 && (
            <tr>
              <td colSpan={3} className="text-center py-1">
                <button
                  onClick={() => setStartRow(Math.max(0, startRow - displayNum + 1))}
                  className="text-gray-400 hover:text-white text-lg bg-transparent border-none cursor-pointer"
                >
                  &#9650;
                </button>
              </td>
            </tr>
          )}
          {indexList.slice(startRow, endRow).map((row, i) => (
            <tr
              key={`${row.name}-${row.user}-${i}`}
              onClick={() => handleRowClick(row)}
              className="cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <td className="py-1 px-2">{row.name}</td>
              <td className="py-1 px-2 text-gray-400">{row.user}</td>
              <td className="py-1 px-2 text-gray-400 text-right">{row.downloads}</td>
            </tr>
          ))}
          {endRow < indexList.length && (
            <tr>
              <td colSpan={3} className="text-center py-1">
                <button
                  onClick={() => setStartRow(startRow + displayNum - 1)}
                  className="text-gray-400 hover:text-white text-lg bg-transparent border-none cursor-pointer"
                >
                  &#9660;
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {indexList.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No vases found</p>
      )}
    </div>
  )
}
