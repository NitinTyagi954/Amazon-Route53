"use client";

import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteDNSRecord } from "@/lib/api/dnsRecords";
import { DNSRecordItem, ApiError } from "@/lib/api/hostedZones";

interface DeleteDNSRecordModalProps {
  isOpen: boolean;
  record: DNSRecordItem | null;
  onClose: () => void;
  onSuccess: (deletedRecordId: number) => void;
}

export const DeleteDNSRecordModal: React.FC<DeleteDNSRecordModalProps> = ({
  isOpen,
  record,
  onClose,
  onSuccess,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !record) return null;

  const handleClose = () => {
    setApiError(null);
    onClose();
  };

  const handleDelete = async () => {
    setApiError(null);
    setIsDeleting(true);
    try {
      await deleteDNSRecord(record.id);
      onSuccess(record.id);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError(err?.message || "An unexpected error occurred while deleting the record.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-lg bg-white border border-[#eaeded] shadow-2xl rounded-[2px] overflow-hidden flex flex-col">
        <div className="border-b border-[#eaeded] px-6 py-4 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-[#16191f]">Delete record</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] rounded-[2px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-[#16191f]">
          {apiError && (
            <div className="p-3 bg-[#fdf3f1] border border-[#eaeded] border-l-4 border-l-[#d13212] rounded-[2px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#d13212] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#d13212]">
                  Unable to delete record
                </div>
                <div className="text-xs">{apiError}</div>
              </div>
            </div>
          )}

          <p>
            Are you sure you want to delete this DNS record? This action cannot be
            undone.
          </p>

          <div className="bg-[#fafafa] border border-[#eaeded] rounded-[2px] p-4 space-y-3">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-semibold text-[#545b64]">Name</span>
              <span className="font-mono truncate">{record.name}</span>
              
              <span className="font-semibold text-[#545b64]">Type</span>
              <span>
                <span className="inline-block px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] bg-[#f2f3f3] text-[#16191f]">
                  {record.type}
                </span>
              </span>
              
              <span className="font-semibold text-[#545b64]">Value</span>
              <span className="font-mono truncate">{record.value}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#eaeded] p-4 flex items-center justify-end gap-3 bg-[#fafafa]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleDelete}
            disabled={isDeleting}
            icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};