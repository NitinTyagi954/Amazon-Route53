"use client";

import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/InfoIcon";
import { createDNSRecord } from "@/lib/api/dnsRecords";
import { DNSRecordItem, ApiError } from "@/lib/api/hostedZones";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"];

interface CreateDNSRecordModalProps {
  isOpen: boolean;
  zoneId: string;
  zoneName: string;
  onClose: () => void;
  onSuccess: (createdRecord: DNSRecordItem) => void;
}

export const CreateDNSRecordModal: React.FC<CreateDNSRecordModalProps> = ({
  isOpen,
  zoneId,
  zoneName,
  onClose,
  onSuccess,
}) => {
  const [recordName, setRecordName] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [ttl, setTtl] = useState("300");
  const [value, setValue] = useState("");

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setRecordName("");
    setRecordType("A");
    setTtl("300");
    setValue("");
    setApiError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const ttlNum = parseInt(ttl, 10);
    if (isNaN(ttlNum) || ttlNum < 0) {
      setApiError("TTL must be a positive number.");
      return;
    }

    if (!value.trim()) {
      setApiError("Record value is required.");
      return;
    }

    // Format full record name
    let formattedName = recordName.trim();
    if (formattedName) {
      formattedName = `${formattedName}.${zoneName}`;
    } else {
      formattedName = zoneName;
    }

    setIsSubmitting(true);
    try {
      const createdRecord = await createDNSRecord(zoneId, {
        name: formattedName,
        type: recordType,
        ttl: ttlNum,
        value: value.trim(),
      });

      resetForm();
      onSuccess(createdRecord);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError(err?.message || "An unexpected error occurred while creating the record.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#eaeded] shadow-2xl rounded-[2px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="border-b border-[#eaeded] px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#16191f]">
              Create record
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] rounded-[2px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {apiError && (
            <div className="p-3 bg-[#fdf3f1] border border-[#eaeded] border-l-4 border-l-[#d13212] rounded-[2px] text-[#16191f] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#d13212] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#d13212]">
                  Unable to create record
                </div>
                <div className="text-xs text-[#16191f]">{apiError}</div>
              </div>
            </div>
          )}

          <div className="border border-[#eaeded] rounded-[2px] p-5 space-y-5 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Record details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#16191f] flex items-center gap-1">
                  <span>Record name</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={recordName}
                    onChange={(e) => setRecordName(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="subdomain"
                    className="w-full px-3 py-1.5 bg-white border border-[#545b64] rounded-l-[2px] text-xs text-[#16191f] focus:border-[#0972d3] outline-none transition-colors disabled:opacity-50"
                  />
                  <div className="px-3 py-1.5 bg-[#f2f3f3] border border-l-0 border-[#545b64] rounded-r-[2px] text-xs text-[#545b64] whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                    .{zoneName}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#16191f] flex items-center gap-1">
                  <span>Record type</span>
                  <span className="text-[#d13212] font-bold">*</span>
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-1.5 bg-white border border-[#545b64] rounded-[2px] text-xs text-[#16191f] focus:border-[#0972d3] outline-none transition-colors disabled:opacity-50"
                >
                  {RECORD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#16191f] flex items-center gap-1">
                <span>Value</span>
                <span className="text-[#d13212] font-bold">*</span>
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                placeholder={`Enter multiple values on separate lines`}
                className="w-full px-3 py-1.5 bg-white border border-[#545b64] rounded-[2px] text-xs text-[#16191f] font-mono focus:border-[#0972d3] outline-none transition-colors resize-y disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#16191f] flex items-center gap-1">
                <span>TTL (Seconds)</span>
                <span className="text-[#d13212] font-bold">*</span>
              </label>
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                disabled={isSubmitting}
                min="0"
                className="w-full max-w-[150px] px-3 py-1.5 bg-white border border-[#545b64] rounded-[2px] text-xs text-[#16191f] focus:border-[#0972d3] outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div className="border-t border-[#eaeded] pt-4 flex items-center justify-end gap-3 bg-white">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {isSubmitting ? "Creating..." : "Create record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};