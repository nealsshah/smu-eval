"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvDropZone({
  onFileLoaded,
}: {
  onFileLoaded: (text: string, fileName: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const readFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileLoaded(text, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleClear() {
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (fileName) {
    return (
      <div className="border border-smu-border rounded-xl p-6 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-smu-text">{fileName}</p>
            <p className="text-xs text-muted-foreground">File loaded successfully</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Remove file">
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
        ${
          dragging
            ? "border-smu-gold bg-smu-gold/5"
            : "border-smu-border hover:border-smu-gold/50 hover:bg-smu-gold/5"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-smu-gold/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-smu-gold" />
        </div>
        <div>
          <p className="text-sm font-medium text-smu-text">
            Drag & drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Expected columns: First Name, Last Name, Email, Group
          </p>
        </div>
      </div>
    </div>
  );
}
