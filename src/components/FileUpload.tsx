
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, CheckCircle, File, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  className?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

const FileUpload = ({ 
  onUploadComplete, 
  acceptedTypes = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg",
  maxFiles = 5,
  className = ""
}: FileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Please select no more than ${maxFiles} files`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('assessment-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('assessment-documents')
          .getPublicUrl(fileName);

        newUploadedFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
      }

      const allFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(allFiles);
      onUploadComplete?.(allFiles);

      toast({
        title: "Upload successful",
        description: `${newUploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    
    try {
      // Extract the file path from the URL
      const urlParts = fileToRemove.url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get user_id/filename

      await supabase.storage
        .from('assessment-documents')
        .remove([filePath]);

      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      onUploadComplete?.(newFiles);

      toast({
        title: "File removed",
        description: "File deleted successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    }
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className={className}>
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <h3 className="font-medium text-slate-900 mb-2">Upload Documents</h3>
        <p className="text-sm text-slate-600 mb-4">
          Select files to upload (max {maxFiles} files)
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Select Files"}
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900 text-lg">
              Uploaded Documents ({uploadedFiles.length})
            </h4>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Ready for analysis
            </div>
          </div>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 flex-1">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {file.type.split('/')[0]} file
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Uploaded</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
