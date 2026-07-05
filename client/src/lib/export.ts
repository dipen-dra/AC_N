import { toast } from "sonner";

export const exportToCSV = (data: any[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);

    // Create CSV string
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? "" : String(row[header]);
          // Escape quotes and wrap in quotes if contains comma
          cell = cell.replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(",")
      )
    ].join("\n");

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export successful!");
  } catch (err: any) {
    console.error("Export error:", err);
    toast.error("Failed to export CSV: " + (err.message || "Unknown error"));
  }
};
