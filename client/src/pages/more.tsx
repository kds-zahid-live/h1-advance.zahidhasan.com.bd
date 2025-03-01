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
import type { MoreTagResult } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function More() {
  const [urls, setUrls] = useState("");
  const [results, setResults] = useState<MoreTagResult[]>([]);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async (urls: string[]) => {
      const res = await apiRequest("POST", "/api/extract-more", { urls });
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
          const h1List = result.h1Texts?.join(' | ') || 'No H1 tags';
          const h2List = result.h2Texts?.join(' | ') || 'No H2 tags';
          const h3List = result.h3Texts?.join(' | ') || 'No H3 tags';
          return `${result.url}\nH1: ${h1List}\nH2: ${h2List}\nH3: ${h3List}`;
        })
        .join("\n\n");
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
          ...result.h2Texts?.reduce((acc, h2, index) => ({
            ...acc,
            [`H2 Tag ${index + 1}`]: h2
          }), {}),
          ...result.h3Texts?.reduce((acc, h3, index) => ({
            ...acc,
            [`H3 Tag ${index + 1}`]: h3
          }), {}),
          ...(result.error ? { Error: result.error } : {})
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "All Tags");
      XLSX.writeFile(workbook, "heading_tags_results.xlsx");

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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tags Extractor - H1 H2 H3
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter URLs
            </label>
            <Textarea
              placeholder="https://zahidhasan.com.bd&#10;https://zahidmama.zahidhasan.com.bd/"
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
              Extract Tags
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

              {results.map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <a 
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-mono"
                      >
                        {result.url}
                      </a>
                    </div>
                    {result.error ? (
                      <p className="text-red-500">{result.error}</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">H1 Tags:</h3>
                          <ul className="list-disc pl-5">
                            {result.h1Texts?.map((text, i) => (
                              <li key={i}>{text}</li>
                            )) || <li className="text-gray-500">No H1 tags found</li>}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">H2 Tags:</h3>
                          <ul className="list-disc pl-5">
                            {result.h2Texts?.map((text, i) => (
                              <li key={i}>{text}</li>
                            )) || <li className="text-gray-500">No H2 tags found</li>}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">H3 Tags:</h3>
                          <ul className="list-disc pl-5">
                            {result.h3Texts?.map((text, i) => (
                              <li key={i}>{text}</li>
                            )) || <li className="text-gray-500">No H3 tags found</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
