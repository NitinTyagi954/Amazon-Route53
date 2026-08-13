"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, AlertCircle, Trash2 } from "lucide-react";
import { HostedZoneItem, deleteHostedZone, ApiError } from "@/lib/api/hostedZones";

interface DeleteHostedZoneModalProps {
  isOpen: boolean;
  zone: HostedZoneItem | null;
  onClose: () => void;
  onSuccess: (deletedZoneId: string, deletedZoneName: string) => void;
}

export function DeleteHostedZoneModal({
  isOpen,
  zone,
  onClose,
  onSuccess,
}: DeleteHostedZoneModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset error state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Escape key closes modal (unless deleting)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !zone) return null;

  const handleDelete = async () => {
    setApiError(null);
    setIsDeleting(true);
    try {
      await deleteHostedZone(zone.id);
      onSuccess(zone.id, zone.name);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError(err?.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-zone-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
          <h2
            id="delete-zone-modal-title"
            className="text-base font-semibold text-[#16191f]"
          >
            Delete hosted zone
          </h2>
          <button
            type="button"
            onClick={() => !isDeleting && onClose()}
            disabled={isDeleting}
            className="text-[#545b64] hover:text-[#16191f] disabled:opacity-50 transition-colors p-1 rounded hover:bg-[#f2f3f3]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-4 border border-[#d13212] bg-[#fdf3f1] rounded-[2px] p-3 flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#d13212] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#d13212] mb-0.5">
                  Deletion failed
                </p>
                <p className="text-xs text-[#16191f] leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          {/* AWS-style warning panel */}
          <div className="mb-5 border border-[#f0b429] bg-[#fffbf0] rounded-[2px] p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#d5780a] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#7d3a00] mb-1">
                This action cannot be undone
              </p>
              <p className="text-xs text-[#16191f] leading-relaxed">
                Deleting this hosted zone will permanently remove it and{" "}
                <strong>all of its DNS records</strong>. If this domain is in use,
                deleting it may cause DNS resolution failures.
              </p>
            </div>
          </div>

          {/* Zone details */}
          <div className="mb-5 p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-[2px] text-xs space-y-1.5">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div>
                <span className="text-[#545b64]">Hosted zone name: </span>
                <span className="font-semibold text-[#16191f]">{zone.name}</span>
              </div>
              <div>
                <span className="text-[#545b64]">Type: </span>
                <span
                  className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] ${
                    !zone.is_private
                      ? "bg-[#e7f4e4] text-[#1d8102]"
                      : "bg-[#f2f3f3] text-[#545b64]"
                  }`}
                >
                  {zone.is_private ? "Private" : "Public"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[#545b64]">Zone ID: </span>
              <span className="font-mono text-[#16191f] text-[11px] break-all">{zone.id}</span>
            </div>
            <div>
              <span className="text-[#545b64]">Record count: </span>
              <span className="text-[#16191f]">{zone.record_count}</span>
            </div>
            {zone.comment && (
              <div>
                <span className="text-[#545b64]">Description: </span>
                <span className="text-[#16191f]">{zone.comment}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-[#16191f] leading-relaxed">
            Are you sure you want to delete{" "}
            <strong>{zone.name}</strong>? This will also delete all DNS records
            associated with this hosted zone.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] rounded-b-[4px]">
          <button
            type="button"
            onClick={() => !isDeleting && onClose()}
            disabled={isDeleting}
            className="px-4 py-1.5 text-xs font-medium border border-[#545b64] rounded-[2px] text-[#16191f] bg-white hover:bg-[#f2f3f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-1.5 text-xs font-medium rounded-[2px] text-white bg-[#d13212] hover:bg-[#b0280e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
