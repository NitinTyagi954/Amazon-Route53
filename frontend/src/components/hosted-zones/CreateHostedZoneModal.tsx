"use client";

import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/InfoIcon";
import { createHostedZone, HostedZoneItem, ApiError } from "@/lib/api/hostedZones";

interface CreateHostedZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdZone: HostedZoneItem) => void;
}

export const CreateHostedZoneModal: React.FC<CreateHostedZoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [domainName, setDomainName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateDomain = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Domain name is required.";
    }
    // Standard domain regex validation
    const domainRegex =
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?\.?$/;
    if (!domainRegex.test(trimmed)) {
      return "Specify a valid domain name, such as example.com or sub.example.com.";
    }
    return null;
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDomainName(val);
    setApiError(null);
    if (touched) {
      setValidationError(validateDomain(val));
    }
  };

  const handleDomainBlur = () => {
    setTouched(true);
    setValidationError(validateDomain(domainName));
  };

  const resetForm = () => {
    setDomainName("");
    setDescription("");
    setType("Public");
    setTouched(false);
    setValidationError(null);
    setApiError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setApiError(null);

    const clientErr = validateDomain(domainName);
    if (clientErr) {
      setValidationError(clientErr);
      return;
    }

    // Format domain name with trailing dot if standard Route 53 format
    let formattedName = domainName.trim();
    if (!formattedName.endsWith(".")) {
      formattedName += ".";
    }

    setIsSubmitting(true);
    try {
      const createdZone = await createHostedZone({
        name: formattedName,
        comment: description.trim() || undefined,
        is_private: type === "Private",
      });

      resetForm();
      onSuccess(createdZone);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError(
          err?.message || "An unexpected error occurred while creating the hosted zone."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#eaeded] shadow-2xl rounded-[2px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="border-b border-[#eaeded] px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#16191f]">
              Create hosted zone
            </h2>
            <InfoIcon
              title="Hosted Zones"
              description="A hosted zone tells Route 53 how to respond to DNS queries for a domain, such as example.com, and its subdomains."
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] rounded-[2px] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {/* Informational Intro */}
          <p className="text-xs text-[#545b64] leading-relaxed">
            A hosted zone contains records that tell Route 53 how to respond to DNS
            queries for a domain such as example.com and its subdomains.
          </p>

          {/* API Error Alert */}
          {apiError && (
            <div className="p-3 bg-[#fdf3f1] border border-[#eaeded] border-l-4 border-l-[#d13212] rounded-[2px] text-[#16191f] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#d13212] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#d13212]">
                  Unable to create hosted zone
                </div>
                <div className="text-xs text-[#16191f]">{apiError}</div>
              </div>
            </div>
          )}

          {/* Section: Hosted zone configuration */}
          <div className="border border-[#eaeded] rounded-[2px] p-5 space-y-5 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Hosted zone configuration
            </h3>

            {/* Field: Domain name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="domain-name"
                  className="font-semibold text-[#16191f] flex items-center gap-1"
                >
                  <span>Domain name</span>
                  <span className="text-[#d13212] font-bold">*</span>
                </label>
              </div>
              <input
                id="domain-name"
                type="text"
                value={domainName}
                onChange={handleDomainChange}
                onBlur={handleDomainBlur}
                disabled={isSubmitting}
                placeholder="example.com"
                className={`w-full px-3 py-1.5 bg-white border ${
                  validationError
                    ? "border-[#d13212] ring-1 ring-[#d13212]"
                    : "border-[#545b64] focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
                } rounded-[2px] text-xs text-[#16191f] outline-none transition-colors disabled:opacity-50`}
              />
              {validationError ? (
                <div className="flex items-center gap-1.5 text-[#d13212] text-xs mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              ) : (
                <p className="text-[11px] text-[#545b64]">
                  Enter a fully qualified domain name, for example, example.com.
                </p>
              )}
            </div>

            {/* Field: Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="zone-description"
                className="font-semibold text-[#16191f] flex items-center justify-between"
              >
                <span>Description - optional</span>
                <span className="text-[11px] text-[#545b64] font-normal">
                  {description.length}/256
                </span>
              </label>
              <textarea
                id="zone-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 256))}
                disabled={isSubmitting}
                rows={3}
                placeholder="Description or purpose of this hosted zone"
                className="w-full px-3 py-1.5 bg-white border border-[#545b64] rounded-[2px] text-xs text-[#16191f] focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3] outline-none transition-colors resize-y disabled:opacity-50"
              />
            </div>

            {/* Field: Type (Public vs Private) */}
            <div className="space-y-2">
              <span className="font-semibold text-[#16191f] block">Type</span>
              
              <div className="space-y-3 pt-1">
                {/* Public option */}
                <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded-[2px] cursor-pointer hover:bg-[#fafafa] transition-colors">
                  <input
                    type="radio"
                    name="zone-type"
                    value="Public"
                    checked={type === "Public"}
                    onChange={() => setType("Public")}
                    disabled={isSubmitting}
                    className="mt-0.5 text-[#ec7211] focus:ring-[#0972d3] cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#16191f]">
                      Public hosted zone
                    </div>
                    <div className="text-[11px] text-[#545b64] leading-relaxed">
                      Determines how traffic is routed on the internet. Choose this
                      option if you want Route 53 to respond to DNS queries from the
                      public internet.
                    </div>
                  </div>
                </label>

                {/* Private option */}
                <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded-[2px] cursor-pointer hover:bg-[#fafafa] transition-colors">
                  <input
                    type="radio"
                    name="zone-type"
                    value="Private"
                    checked={type === "Private"}
                    onChange={() => setType("Private")}
                    disabled={isSubmitting}
                    className="mt-0.5 text-[#ec7211] focus:ring-[#0972d3] cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#16191f]">
                      Private hosted zone
                    </div>
                    <div className="text-[11px] text-[#545b64] leading-relaxed">
                      Determines how traffic is routed within one or more Amazon VPCs.
                      Choose this option if you want Route 53 to respond to DNS
                      queries only within private VPCs.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer / Actions */}
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
              {isSubmitting ? "Creating..." : "Create hosted zone"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
