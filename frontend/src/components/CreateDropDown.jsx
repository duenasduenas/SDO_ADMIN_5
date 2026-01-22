import { useState } from "react";
import { FolderPlus, FilePlus, ChevronDown } from "lucide-react";

export default function CreateDropDown({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* MAIN BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <span>Create New</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Click outside overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect?.("folder");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
            >
              <FolderPlus className="w-5 h-5 text-blue-600" />
              <span className="font-medium">New Folder</span>
            </button>

            <div className="border-t" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect?.("record");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
            >
              <FilePlus className="w-5 h-5 text-green-600" />
              <span className="font-medium">New Record</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
