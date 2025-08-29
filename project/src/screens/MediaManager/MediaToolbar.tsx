// project/src/screens/Dashboard/MediaToolbar.tsx
import { Button } from "@/components/ui/button";
import { Grid, List, Upload } from "lucide-react";

type Props = {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  onUploadClick: () => void;
};

const MediaToolbar = ({ view, setView, onUploadClick }: Props) => {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex gap-2">
        <Button
          className="cursor-pointer hover:brightness-90 dim"
          variant={view === "grid" ? "default" : "outline"}
          onClick={() => setView("grid")}
        >
          <Grid size={16} className="mr-1" /> Grid
        </Button>
        <Button
          className="cursor-pointer hover:brightness-90 dim"
          variant={view === "list" ? "default" : "outline"}
          onClick={() => setView("list")}
        >
          <List size={16} className="mr-1" /> List
        </Button>
      </div>
      <Button
        className="cursor-pointer hover:brightness-90 dim"
        onClick={onUploadClick}
      >
        <Upload size={16} className="mr-1" /> Upload
      </Button>
    </div>
  );
};

export default MediaToolbar;
