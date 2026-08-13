"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, AlertCircle, Globe, Lock } from "lucide-react";
import {
  HostedZoneItem,
  UpdateHostedZoneRequest,
  updateHostedZone,
  ApiError,
} from "@/lib/api/hostedZones";

interface EditHostedZoneModalProps {
  isOpen: boolean;
  zone: HostedZoneItem | null;
  onClose: () => void;
  onSuccess: (updatedZone: HostedZoneItem) => void;
}

interface FormErrors {
  name?: string;
}

export function EditHostedZoneModal({
  isOpen,
  zone,
  onClose,
  onSuccess,
}: EditHostedZoneModalProps) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate form when zone changes
  useEffect(() => {
    if (zone && isOpen) {
      setName(zone.name || "");
      setComment(zone.comment || "");
      setIsPrivate(zone.is_private ?? false);
      setErrors({});
      setApiError(null);
    }
  }, [zone, isOpen]);

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !zone) return null;

  const validateDomainName = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return "Domain name is required.";
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?$/;
    if (!domainRegex.test(trimmed)) {
      return "Enter a valid domain name (e.g., example.com).";
    }
    return undefined;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const nameError = validateDomainName(name);
    if (nameError) newErrors.name = nameError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const trimmed = name.trim();
      const payload: UpdateHostedZoneRequest = {
        name: trimmed.endsWith(".") ? trimmed : `${trimmed}.`,
        comment: comment.trim() || null,
        is_private: isPrivate,
      };
      const updated = await updateHostedZone(zone.id, payload);
      onSuccess(updated);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError(
          err?.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-zone-modal-title"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[4px] shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded] shrink-0">
          <h2
            id="edit-zone-modal-title"
            className="text-base font-semibold text-[#16191f]"
          >
            Edit hosted zone
          </h2>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="text-[#545b64] hover:text-[#16191f] disabled:opacity-50 transition-colors p-1 rounded hover:bg-[#f2f3f3]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* API Error Banner */}
          {apiError && (
            <div className="mb-4 border border-[#d13212] bg-[#fdf3f1] rounded-[2px] p-3 flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#d13212] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#d13212] mb-0.5">
                  Unable to save changes
                </p>
                <p className="text-xs text-[#16191f] leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          <form id="edit-zone-form" onSubmit={handleSubmit} noValidate>
            {/* Read-only zone info */}
            <div className="mb-5 p-3 bg-[#f8f9fa] border border-[#eaeded] rounded-[2px]">
              <p className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide mb-2">
                Zone information (read-only)
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div>
                  <span className="text-[#545b64]">Zone ID: </span>
                  <span className="font-mono text-[#16191f] text-[11px] break-all">{zone.id}</span>
                </div>
                <div>
                  <span className="text-[#545b64]">Record count: </span>
                  <span className="text-[#16191f]">{zone.record_count}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#545b64]">Caller reference: </span>
                  <span className="font-mono text-[#16191f] text-[11px] break-all">{zone.caller_reference}</span>
                </div>
                <div>
                  <span className="text-[#545b64]">Created: </span>
                  <span className="text-[#16191f]">
                    {new Date(zone.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Domain Name */}
            <div className="mb-5">
              <label
                htmlFor="edit-zone-name"
                className="block text-xs font-semibold text-[#16191f] mb-1"
              >
                Domain name{" "}
                <span className="text-[#d13212]" aria-hidden="true">*</span>
              </label>
              <p className="text-xs text-[#545b64] mb-2 leading-relaxed">
                The name of the domain, such as{" "}
                <span className="font-mono">example.com</span>. Route 53
                automatically appends a trailing dot.
              </p>
              <input
                ref={nameInputRef}
                id="edit-zone-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                disabled={isSubmitting}
                placeholder="example.com"
                className={`w-full px-3 py-1.5 text-xs border rounded-[2px] outline-none transition-colors text-[#16191f] placeholder-gray-400 ${
                  errors.name
                    ? "border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
                    : "border-[#545b64] focus:ring-1 focus:ring-[#0972d3] focus:border-[#0972d3]"
                } disabled:bg-[#f2f3f3] disabled:cursor-not-allowed`}
                aria-required="true"
                aria-describedby={errors.name ? "edit-zone-name-error" : undefined}
              />
              {errors.name && (
                <p
                  id="edit-zone-name-error"
                  className="mt-1.5 text-xs text-[#d13212] flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-5">
              <label
                htmlFor="edit-zone-comment"
                className="block text-xs font-semibold text-[#16191f] mb-1"
              >
                Description{" "}
                <span className="text-xs font-normal text-[#545b64]">- optional</span>
              </label>
              <p className="text-xs text-[#545b64] mb-2 leading-relaxed">
                An optional comment to help you identify this hosted zone.
              </p>
              <input
                id="edit-zone-comment"
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. Production website zone"
                maxLength={256}
                className="w-full px-3 py-1.5 text-xs border border-[#545b64] rounded-[2px] outline-none focus:ring-1 focus:ring-[#0972d3] focus:border-[#0972d3] text-[#16191f] placeholder-gray-400 transition-colors disabled:bg-[#f2f3f3] disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-[#545b64] text-right">
                {comment.length}/256
              </p>
            </div>

            {/* Zone Type */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-[#16191f] mb-1">
                Type <span className="text-[#d13212]" aria-hidden="true">*</span>
              </p>
              <p className="text-xs text-[#545b64] mb-3 leading-relaxed">
                Choose whether this hosted zone routes traffic on the internet (public)
                or only within a VPC (private).
              </p>

              {/* Public */}
              <label
                className={`flex items-start gap-3 p-3 border rounded-[2px] cursor-pointer mb-2 transition-colors ${
                  !isPrivate ? "border-[#0972d3] bg-[#ebf3fb]" : "border-[#eaeded] hover:border-[#aab7b8]"
                }`}
              >
                <input
                  type="radio"
                  name="edit-zone-type"
                  value="public"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  disabled={isSubmitting}
                  className="mt-0.5 text-[#0972d3] focus:ring-[#0972d3] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Globe className="w-3.5 h-3.5 text-[#0972d3]" />
                    <span className="text-xs font-semibold text-[#16191f]">
                      Public hosted zone
                    </span>
                  </div>
                  <p className="text-[11px] text-[#545b64] leading-relaxed">
                    Routes traffic on the internet. DNS queries are answered using
                    public DNS nameservers.
                  </p>
                </div>
              </label>

              {/* Private */}
              <label
                className={`flex items-start gap-3 p-3 border rounded-[2px] cursor-pointer transition-colors ${
                  isPrivate ? "border-[#0972d3] bg-[#ebf3fb]" : "border-[#eaeded] hover:border-[#aab7b8]"
                }`}
              >
                <input
                  type="radio"
                  name="edit-zone-type"
                  value="private"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  disabled={isSubmitting}
                  className="mt-0.5 text-[#0972d3] focus:ring-[#0972d3] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Lock className="w-3.5 h-3.5 text-[#545b64]" />
                    <span className="text-xs font-semibold text-[#16191f]">
                      Private hosted zone
                    </span>
                  </div>
                  <p className="text-[11px] text-[#545b64] leading-relaxed">
                    Routes traffic within one or more Amazon Virtual Private Clouds
                    (VPCs).
                  </p>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] shrink-0 rounded-b-[4px]">
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-medium border border-[#545b64] rounded-[2px] text-[#16191f] bg-white hover:bg-[#f2f3f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-zone-form"
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-medium rounded-[2px] text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
