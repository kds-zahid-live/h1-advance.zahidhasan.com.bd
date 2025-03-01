import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Download, Trash2 } from "lucide-react";
import type { UrlResult } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function Home() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState<UrlResult[]>([]);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async (urls: string[]) => {
      const res = await apiRequest("POST", "/api/extract-h1", { urls });
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    if (urlList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one URL",
        variant: "destructive",
      });
      return;
    }

    mutate(urlList);
  };

  const copyToClipboard = async () => {
    try {
      const text = results
        .map((result) => {
          const h1List = result.h1Texts?.join(' | ') || result.error;
          return `${result.url}\t${h1List}`;
        })
        .join("\n");
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Results copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy results",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setUrls("");
    setResults([]);
    toast({
      title: "Success",
      description: "All data has been cleared",
    });
  };

  const handleDownload = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        results.map(result => ({
          URL: result.url,
          ...result.h1Texts?.reduce((acc, h1, index) => ({
            ...acc,
            [`H1 Tag ${index + 1}`]: h1
          }), {}),
          ...(result.error ? { Error: result.error } : {})
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "H1 Tags");

      XLSX.writeFile(workbook, "h1_tags_results.xlsx");

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // Calculate maximum number of H1 tags for table headers
  const maxH1Tags = Math.max(0, ...results.map(r => r.h1Texts?.length || 0));
  const h1Headers = Array.from({ length: maxH1Tags }, (_, i) => `H1 Tag ${i + 1}`);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            URL H1 Tag Extractor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter URLs (one per line)
            </label>
            <Textarea
              placeholder="https://example.com&#10;https://another-example.com"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isPending || (!urls && results.length === 0)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extract H1 Tags
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Results</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      {h1Headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono">
                          <a 
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {result.url}
                          </a>
                        </TableCell>
                        {result.error ? (
                          <TableCell colSpan={h1Headers.length} className="text-red-500">
                            {result.error}
                          </TableCell>
                        ) : (
                          result.h1Texts?.map((h1Text, index) => (
                            <TableCell key={index}>{h1Text}</TableCell>
                          ))
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}