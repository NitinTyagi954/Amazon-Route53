"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  X,
  Loader2,
  Edit2,
  Trash2,
  ArrowLeft,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  HostedZoneItem,
  DNSRecordItem,
  getHostedZone,
  getHostedZoneRecords,
  ApiError,
} from "@/lib/api/hostedZones";
import { CreateDNSRecordModal } from "@/components/hosted-zones/CreateDNSRecordModal";
import { EditDNSRecordModal } from "@/components/hosted-zones/EditDNSRecordModal";
import { DeleteDNSRecordModal } from "@/components/hosted-zones/DeleteDNSRecordModal";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params?.zoneId as string;

  const [zone, setZone] = useState<HostedZoneItem | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<{
    type: "error" | "warning";
    title: string;
    message: string;
  } | null>(null);

  const [records, setRecords] = useState<DNSRecordItem[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPageSize] = useState(10);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [recordsSearch, setRecordsSearch] = useState("");
  const [isRefreshingRecords, setIsRefreshingRecords] = useState(false);
  
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DNSRecordItem | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DNSRecordItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchZone = useCallback(async () => {
    if (!zoneId) return;
    setZoneLoading(true);
    setZoneError(null);
    try {
      const data = await getHostedZone(zoneId);
      setZone(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setZoneError({
            type: "error",
            title: "Authentication error",
            message: "Your session has expired. Please sign in again.",
          });
        } else if (err.statusCode === 404) {
          setZoneError({
            type: "error",
            title: "Hosted zone not found",
            message: `No hosted zone with ID "${zoneId}" exists or you do not have access to it.`,
          });
        } else if (err.statusCode === 0) {
          setZoneError({
            type: "error",
            title: "Unable to connect to backend",
            message: err.message,
          });
        } else {
          setZoneError({ type: "error", title: "Error", message: err.message });
        }
      } else {
        setZoneError({
          type: "error",
          title: "Unexpected error",
          message: err?.message || "An unexpected error occurred.",
        });
      }
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId]);

  const fetchRecords = useCallback(
    async (page: number, search: string, refreshSpinner = false) => {
      if (!zoneId) return;
      if (refreshSpinner) setIsRefreshingRecords(true);
      else setRecordsLoading(true);
      setRecordsError(null);
      try {
        const data = await getHostedZoneRecords(zoneId, page, recordsPageSize, search);
        setRecords(data.items || []);
        setRecordsTotal(data.total || 0);
        setRecordsPage(data.page || page);
      } catch (err: any) {
        setRecordsError(
          err instanceof ApiError
            ? err.message
            : err?.message || "Failed to load DNS records."
        );
        setRecords([]);
        setRecordsTotal(0);
      } finally {
        setRecordsLoading(false);
        setIsRefreshingRecords(false);
      }
    },
    [zoneId, recordsPageSize]
  );

  useEffect(() => {
    fetchZone();
  }, [fetchZone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(recordsPage, recordsSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchRecords, recordsPage, recordsSearch]);

  const recordsTotalPages = Math.max(1, Math.ceil(recordsTotal / recordsPageSize));
  const recordsStart = recordsTotal === 0 ? 0 : (recordsPage - 1) * recordsPageSize + 1;
  const recordsEnd = Math.min(recordsPage * recordsPageSize, recordsTotal);

  const handleRecordsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecordsSearch(e.target.value);
    setRecordsPage(1);
    setSelectedRecordId(null);
  };

  const handleClearRecordsSearch = () => {
    setRecordsSearch("");
    setRecordsPage(1);
    setSelectedRecordId(null);
  };

  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  const canEditOrDelete = selectedRecord && !selectedRecord.is_system_record;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchZone(); // update record count
    fetchRecords(1, recordsSearch, true);
    showSuccess("DNS record created successfully.");
  };

  const handleEditSuccess = () => {
    setRecordToEdit(null);
    fetchRecords(recordsPage, recordsSearch, true);
    showSuccess("DNS record updated successfully.");
  };

  const handleDeleteSuccess = () => {
    setRecordToDelete(null);
    setSelectedRecordId(null);
    fetchZone(); // update record count
    fetchRecords(recordsPage, recordsSearch, true);
    showSuccess("DNS record deleted successfully.");
  };

  if (zoneLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#545b64]">
          <Link href="/hosted-zones" className="text-[#0972d3] hover:underline">
            Hosted zones
          </Link>
          <span>/</span>
          <span className="bg-[#eaeded] rounded w-40 h-3 inline-block animate-pulse" />
        </div>
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-[#ec7211] animate-spin" />
          <p className="text-xs text-[#545b64]">Loading hosted zone details...</p>
        </div>
      </div>
    );
  }

  if (zoneError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#545b64]">
          <Link href="/hosted-zones" className="text-[#0972d3] hover:underline">
            Hosted zones
          </Link>
          <span>/</span>
          <span>{zoneId}</span>
        </div>
        <Alert type={zoneError.type} title={zoneError.title}>
          {zoneError.message}
        </Alert>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/hosted-zones")}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to hosted zones
        </Button>
      </div>
    );
  }

  if (!zone) return null;

  return (
    <div className="space-y-5 relative pb-10">
      <nav className="flex items-center gap-1.5 text-xs text-[#545b64]">
        <Link href="/hosted-zones" className="text-[#0972d3] hover:underline">
          Hosted zones
        </Link>
        <span className="text-[#aab7b8]">/</span>
        <span className="text-[#16191f] font-medium truncate max-w-[260px]">{zone.name}</span>
      </nav>

      {successMessage && (
        <div className="p-3 bg-[#f2f8fd] border border-[#eaeded] border-l-4 border-l-[#1d8102] rounded-[2px] text-[#16191f] flex items-start gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#1d8102] shrink-0 mt-0.5" />
          <div className="text-xs font-medium">{successMessage}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#16191f] leading-tight">{zone.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#545b64]">
            <span>
              Hosted zone ID:{" "}
              <span className="font-mono text-[#16191f]">{zone.id}</span>
            </span>
            <span>·</span>
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
      </div>

      <section className="bg-white border border-[#eaeded] rounded-[2px] shadow-sm">
        <div className="px-4 py-3 border-b border-[#eaeded] bg-[#fafafa]">
          <h2 className="text-sm font-bold text-[#16191f]">Hosted zone details</h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { label: "Hosted zone name", value: zone.name },
              { label: "Hosted zone ID", value: <span className="font-mono">{zone.id}</span> },
              {
                label: "Type",
                value: (
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] ${
                      !zone.is_private
                        ? "bg-[#e7f4e4] text-[#1d8102]"
                        : "bg-[#f2f3f3] text-[#545b64]"
                    }`}
                  >
                    {zone.is_private ? "Private" : "Public"}
                  </span>
                ),
              },
              {
                label: "Description",
                value: zone.comment || <span className="text-[#aab7b8]">No description</span>,
              },
              {
                label: "Record count",
                value: <span className="font-mono">{zone.record_count ?? "—"}</span>,
              },
              {
                label: "Caller reference",
                value: <span className="font-mono break-all">{zone.caller_reference}</span>,
              },
              { label: "Created", value: formatDate(zone.created_at) },
            ] as { label: string; value: React.ReactNode }[]
          ).map(({ label, value }) => (
            <div key={label} className="px-4 py-3 border-b border-[#eaeded] last:border-b-0">
              <dt className="text-[11px] font-semibold text-[#545b64] uppercase tracking-wide mb-0.5">
                {label}
              </dt>
              <dd className="text-xs text-[#16191f]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white border border-[#eaeded] rounded-[2px] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#eaeded] bg-[#fafafa] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-[#16191f]">
            Records{recordsTotal > 0 ? ` (${recordsTotal})` : ""}
          </h2>
          
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                fetchRecords(recordsPage, recordsSearch, true);
              }}
              title="Refresh"
              icon={
                <RotateCw
                  className={`w-3.5 h-3.5 ${isRefreshingRecords ? "animate-spin" : ""}`}
                />
              }
            />
            <Button
              variant="secondary"
              size="md"
              disabled={!canEditOrDelete}
              onClick={() => {
                if (canEditOrDelete && selectedRecord) {
                  setRecordToEdit(selectedRecord);
                }
              }}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              title={
                !selectedRecord
                  ? "Select a record to edit"
                  : selectedRecord.is_system_record
                  ? "System records cannot be edited"
                  : ""
              }
            >
              Edit record
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={!canEditOrDelete}
              onClick={() => {
                if (canEditOrDelete && selectedRecord) {
                  setRecordToDelete(selectedRecord);
                }
              }}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              title={
                !selectedRecord
                  ? "Select a record to delete"
                  : selectedRecord.is_system_record
                  ? "System records cannot be deleted"
                  : ""
              }
            >
              Delete record
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create record
            </Button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[#eaeded] flex gap-3">
          <div className="flex-1 max-w-sm">
            <div className="flex items-center bg-white border border-[#545b64] rounded-[2px] px-2.5 py-1 text-xs focus-within:ring-1 focus-within:ring-[#0972d3] focus-within:border-[#0972d3]">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
              <input
                id="records-search"
                type="text"
                placeholder="Find records by name or value"
                value={recordsSearch}
                onChange={handleRecordsSearchChange}
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500"
              />
              {recordsSearch && (
                <button
                  type="button"
                  onClick={handleClearRecordsSearch}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {recordsError && (
          <div className="p-4">
            <Alert type="error" title="Failed to load DNS records" onDismiss={() => setRecordsError(null)}>
              {recordsError}
            </Alert>
          </div>
        )}

        {recordsLoading ? (
          <div className="py-14 text-center">
            <Loader2 className="w-5 h-5 text-[#ec7211] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#545b64]">Loading records...</p>
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded]">
                  <th className="py-2.5 px-4 w-10"></th>
                  {["Record name", "Type", "Routing policy", "Value/Route traffic to", "TTL (Seconds)", "System record"].map((col) => (
                    <th key={col} className="py-2.5 px-4 font-semibold text-[#16191f] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="radio"
                        name="record-select"
                        checked={selectedRecordId === rec.id}
                        onChange={() => setSelectedRecordId(rec.id)}
                        className="w-3.5 h-3.5 text-[#ec7211] focus:ring-[#0972d3] border-[#879596] rounded-full cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#0972d3] font-medium max-w-[200px] truncate">
                      {rec.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-block px-1.5 py-0.5 text-[11px] font-semibold rounded-[2px] bg-[#f2f3f3] text-[#16191f]">
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#16191f]">Simple</td>
                    <td className="py-2.5 px-4 font-mono text-[#16191f] max-w-[300px] whitespace-pre-wrap break-all">
                      {rec.value}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#545b64]">{rec.ttl}</td>
                    <td className="py-2.5 px-4">
                      {rec.is_system_record ? (
                        <span className="inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] bg-[#f2f3f3] text-[#545b64]">
                          Yes
                        </span>
                      ) : (
                        <span className="text-[#aab7b8]">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center">
            <h4 className="text-sm font-bold text-[#16191f] mb-1">No records</h4>
            <p className="text-xs text-[#545b64] max-w-sm mx-auto leading-relaxed">
              {recordsSearch
                ? `No records match the search "${recordsSearch}".`
                : "This hosted zone does not have any records yet."}
            </p>
          </div>
        )}

        {!recordsLoading && recordsTotal > 0 && (
          <div className="border-t border-[#eaeded] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#545b64] bg-[#fafafa]">
            <span>
              Showing {recordsStart}-{recordsEnd} of {recordsTotal} records
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={recordsPage <= 1}
                onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-[2px] border border-[#545b64] text-[#16191f] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-[#16191f]">
                {recordsPage} / {recordsTotalPages}
              </span>
              <button
                type="button"
                disabled={recordsPage >= recordsTotalPages}
                onClick={() => setRecordsPage((p) => Math.min(recordsTotalPages, p + 1))}
                className="p-1 rounded-[2px] border border-[#545b64] text-[#16191f] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      <CreateDNSRecordModal
        isOpen={isCreateModalOpen}
        zoneId={zone.id}
        zoneName={zone.name}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditDNSRecordModal
        isOpen={!!recordToEdit}
        zoneName={zone.name}
        record={recordToEdit}
        onClose={() => setRecordToEdit(null)}
        onSuccess={handleEditSuccess}
      />

      <DeleteDNSRecordModal
        isOpen={!!recordToDelete}
        record={recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}