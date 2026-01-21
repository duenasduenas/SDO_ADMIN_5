import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AddRecord() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [recordId, setRecordId] = useState("");
    const [category, setCategory] = useState("")
    const [ title, setTitle ] = useState("")
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!folderId) {
            setMessage("Invalid folder");
        }
    }, [folderId]);

    const addRecord = async () => {
        if (!title) return setMessage("Record ID is required");

        try {
            const res = await fetch(
                `http://localhost:5001/api/folder/add-record/${folderId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title })
                }
            );



            const data = await res.json();
            setMessage(data.message);

            if (res.ok) {
                setTimeout(() => navigate(-1), 1000);
            }
        } catch {
            setMessage("Server error");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-lg font-semibold mb-3">Add Record</h2>

            <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Record ID"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            
            <button
                onClick={addRecord}
                disabled={!folderId}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
                Add to Folder
            </button>

            {message && (
                <p className="mt-2 text-sm text-gray-600">{message}</p>
            )}
        </div>
    );
}
