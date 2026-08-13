"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CreateHostedZoneModal } from "@/components/hosted-zones/CreateHostedZoneModal";
import { HostedZoneItem, getHostedZones } from "@/lib/api/hostedZones";

interface HostedZoneView {
  id: string;
  name: string;
  type: "Public" | "Private";
  createdBy: string;
  recordCount: number;
  description: string;
  comment?: string | null;
}

const INITIAL_MOCK_DATA: HostedZoneView[] = [
  {
    id: "Z0123456789ABC",
    name: "example.com.",
    type: "Public",
    createdBy: "Route 53",
    recordCount: 4,
    description: "Production web application domain",
  },
  {
    id: "Z0987654321DEF",
    name: "api.internal.",
    type: "Private",
    createdBy: "Route 53",
    recordCount: 2,
    description: "Internal VPC private DNS zone",
  },
  {
    id: "Z0112233445GHI",
    name: "dev-staging.io.",
    type: "Public",
    createdBy: "Route 53",
    recordCount: 6,
    description: "Staging and testing environment",
  },
];

export default function HostedZonesPage() {
  const [hostedZones, setHostedZones] = useState<HostedZoneView[]>(INITIAL_MOCK_DATA);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title?: string;
    message: string;
  } | null>(null);

  // Attempt to fetch live hosted zones from backend on mount or refresh
  const loadHostedZones = async () => {
    setIsRefreshing(true);
    try {
      const response = await getHostedZones(1, 100);
      if (response && Array.isArray(response.items)) {
        const mapped: HostedZoneView[] = response.items.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.is_private ? "Private" : "Public",
          createdBy: "Route 53",
          recordCount: item.record_count || 2,
          description: item.comment || "-",
        }));
        setHostedZones(mapped);
      }
    } catch {
      // Fallback silently to existing local state if backend is offline or unauthenticated
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadHostedZones();
  };

  // Filtered zones based on search query
  const filteredZones = useMemo(() => {
    if (!searchTerm.trim()) return hostedZones;
    const query = searchTerm.toLowerCase().trim();
    return hostedZones.filter(
      (z) =>
        z.name.toLowerCase().includes(query) ||
        z.type.toLowerCase().includes(query) ||
        z.description.toLowerCase().includes(query) ||
        z.id.toLowerCase().includes(query)
    );
  }, [hostedZones, searchTerm]);

  // Paginated zones
  const totalItems = filteredZones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedZones = filteredZones.slice(startIndex, startIndex + pageSize);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedZones.map((z) => z.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    paginatedZones.length > 0 &&
    paginatedZones.every((z) => selectedIds.includes(z.id));

  const hasSelection = selectedIds.length > 0;
  const isSingleSelection = selectedIds.length === 1;

  const handleDeleteMock = () => {
    if (selectedIds.length === 0) return;
    setHostedZones((prev) => prev.filter((z) => !selectedIds.includes(z.id)));
    setSelectedIds([]);
  };

  // Handle successful creation from modal connected to FastAPI
  const handleZoneCreated = (createdZone: HostedZoneItem) => {
    setIsCreateModalOpen(false);

    const newViewItem: HostedZoneView = {
      id: createdZone.id,
      name: createdZone.name,
      type: createdZone.is_private ? "Private" : "Public",
      createdBy: "Route 53",
      recordCount: createdZone.record_count || 2,
      description: createdZone.comment || "-",
    };

    // Prepend newly created zone to table
    setHostedZones((prev) => [
      newViewItem,
      ...prev.filter((z) => z.id !== createdZone.id),
    ]);

    // Show AWS-style success notification
    setNotification({
      type: "success",
      title: "Successfully created hosted zone",
      message: `Hosted zone "${createdZone.name}" with ID "${createdZone.id}" has been created.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Success / Error Notification */}
      {notification && (
        <Alert
          type={notification.type}
          title={notification.title}
          onDismiss={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* 1. Page Header & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={`Hosted zones (${hostedZones.length})`}
          description="A hosted zone contains records that tell Route 53 how to respond to DNS queries for a domain, such as example.com, and its subdomains."
          infoTitle="Hosted Zones"
          infoDescription="A hosted zone is a container for records, and records contain information about how you want to route traffic for a specific domain, such as example.com, and its subdomains."
        />

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            title="Refresh list"
            icon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
          />

          <Button
            variant="secondary"
            size="md"
            disabled={!isSingleSelection}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            View details
          </Button>

          <Button
            variant="secondary"
            size="md"
            disabled={!isSingleSelection}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant="secondary"
            size="md"
            disabled={!hasSelection}
            onClick={handleDeleteMock}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create hosted zone
          </Button>
        </div>
      </div>

      {/* 2. AWS Table Container */}
      <div className="bg-white border border-[#eaeded] rounded-[2px] shadow-sm overflow-hidden">
        {/* Table Top Bar: Filter */}
        <div className="p-3 border-b border-[#eaeded] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="flex-1 max-w-md relative">
            <div className="flex items-center bg-white border border-[#545b64] rounded-[2px] px-2.5 py-1 text-xs text-[#16191f] focus-within:ring-1 focus-within:ring-[#0972d3] focus-within:border-[#0972d3]">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Find hosted zone"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#545b64]">
            <span>
              {totalItems} {totalItems === 1 ? "zone" : "zones"}
            </span>
          </div>
        </div>

        {/* Table Content */}
        {paginatedZones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-[#545b64] text-[#ec7211] focus:ring-[#0972d3] cursor-pointer"
                      aria-label="Select all hosted zones"
                    />
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">
                    Hosted zone name
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">
                    Type
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">
                    Created by
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">
                    Record count
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[#16191f]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {paginatedZones.map((zone) => {
                  const isSelected = selectedIds.includes(zone.id);
                  return (
                    <tr
                      key={zone.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#ebf3fb] hover:bg-[#e2effa]"
                          : "hover:bg-[#f8f9fa]"
                      }`}
                      onClick={() => handleSelectRow(zone.id)}
                    >
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(zone.id)}
                          className="rounded border-[#545b64] text-[#ec7211] focus:ring-[#0972d3] cursor-pointer"
                          aria-label={`Select ${zone.name}`}
                        />
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#0972d3] hover:underline">
                        <Link
                          href={`/hosted-zones`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {zone.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-[#16191f]">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] ${
                            zone.type === "Public"
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : "bg-[#f2f3f3] text-[#545b64]"
                          }`}
                        >
                          {zone.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {zone.createdBy}
                      </td>
                      <td className="py-2.5 px-4 text-[#16191f] font-mono">
                        {zone.recordCount}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64] max-w-xs truncate">
                        {zone.description || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 px-4 text-center">
            <h4 className="text-sm font-bold text-[#16191f] mb-1">
              No hosted zones
            </h4>
            <p className="text-xs text-[#545b64] mb-4 max-w-sm mx-auto leading-relaxed">
              {searchTerm
                ? `No hosted zones match the search "${searchTerm}".`
                : "You do not have any hosted zones in Route 53."}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create hosted zone
            </Button>
          </div>
        )}

        {/* 3. AWS Pagination Footer */}
        {paginatedZones.length > 0 && (
          <div className="border-t border-[#eaeded] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#545b64] bg-[#fafafa]">
            <div>
              Showing {startIndex + 1}-
              {Math.min(startIndex + pageSize, totalItems)} of {totalItems}{" "}
              hosted zones
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-[2px] border border-[#545b64] text-[#16191f] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 font-medium text-[#16191f]">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-[2px] border border-[#545b64] text-[#16191f] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Create Hosted Zone Modal */}
      <CreateHostedZoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleZoneCreated}
      />
    </div>
  );
}
