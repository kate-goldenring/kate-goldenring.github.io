import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, AlertCircle, Check } from 'lucide-react';
import { imageService, ImageUploadResult } from '../../services/imageService';

interface ImageUploadProps {
  onImageUploaded: (result: ImageUploadResult) => void;
  onError?: (error: string) => void;
  className?: string;
  accept?: string;
  multiple?: boolean;
  folder?: string;
}

export default function ImageUpload({
  onImageUploaded,
  onError,
  className = '',
  accept = 'image/*,.heic,.heif',
  multiple = false,
  folder
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    photographer: '',
    copyright: '',
    altText: '',
    caption: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file
    const validation = imageService.validateImageFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setShowMetadataForm(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress('Preparing upload...');

    try {
      // Check if it's a HEIC file and show conversion message
      const isHeic = selectedFile.type === 'image/heic' || 
                     selectedFile.type === 'image/heif' ||
                     selectedFile.name.toLowerCase().endsWith('.heic') ||
                     selectedFile.name.toLowerCase().endsWith('.heif');
      
      if (isHeic) {
        setUploadProgress('Converting HEIC to JPEG...');
      } else {
        setUploadProgress('Uploading image...');
      }

      // Upload image with metadata
      const result = await imageService.uploadImage(selectedFile, folder, {
        photographer: metadata.photographer || 'Kate Goldenring',
        copyright: metadata.copyright || '© 2024 Continued Education Blog. All rights reserved.',
        altText: metadata.altText,
        caption: metadata.caption
      });

      setUploadProgress('Upload complete!');
      onImageUploaded(result);

      // Reset form
      setSelectedFile(null);
      setShowMetadataForm(false);
      setMetadata({
        photographer: '',
        copyright: '',
        altText: '',
        caption: ''
      });

      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setShowMetadataForm(false);
    setMetadata({
      photographer: '',
      copyright: '',
      altText: '',
      caption: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileTypeDisplay = (file: File) => {
    const isHeic = file.type === 'image/heic' || 
                   file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif');
    
    if (isHeic) {
      return `${file.name} (will be converted to JPEG)`;
    }
    
    return file.name;
  };

  if (showMetadataForm && selectedFile) {
    return (
      <div className={`bg-white border border-gray-300 rounded-lg p-6 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Details</h3>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>{getFileTypeDisplay(selectedFile)}</span>
            <span>•</span>
            <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photographer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.photographer}
              onChange={(e) => setMetadata(prev => ({ ...prev, photographer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter photographer name (leave blank if it's your photo)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to default to "Kate Goldenring"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copyright Notice
            </label>
            <input
              type="text"
              value={metadata.copyright}
              onChange={(e) => setMetadata(prev => ({ ...prev, copyright: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="© 2024 Photographer Name. All rights reserved."
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use default: "© 2024 Continued Education Blog. All rights reserved."
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text (for accessibility)
            </label>
            <input
              type="text"
              value={metadata.altText}
              onChange={(e) => setMetadata(prev => ({ ...prev, altText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the image for screen readers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption (optional)
            </label>
            <textarea
              value={metadata.caption}
              onChange={(e) => setMetadata(prev => ({ ...prev, caption: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional caption for the image"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP, HEIC up to 50MB
            </p>
          </div>
        )}

        {dragActive && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-blue-600 font-medium">Drop image here</div>
          </div>
        )}
      </div>
    </div>
  );
}