import { useSTLExport } from '../hooks/useSTLExport'

export default function ExportPanel({ meshRef }) {
  const { exportASCII, exportBinary } = useSTLExport(meshRef)

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Export</h3>
      <div className="flex gap-2">
        <button
          onClick={exportASCII}
          className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          STL (ASCII)
        </button>
        <button
          onClick={exportBinary}
          className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          STL (Binary)
        </button>
      </div>
    </div>
  )
}
