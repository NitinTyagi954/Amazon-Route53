"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CreateHostedZoneModal } from "@/components/hosted-zones/CreateHostedZoneModal";
import { EditHostedZoneModal } from "@/components/hosted-zones/EditHostedZoneModal";
import { DeleteHostedZoneModal } from "@/components/hosted-zones/DeleteHostedZoneModal";
import {
  HostedZoneItem,
  getHostedZones,
  ApiError,
} from "@/lib/api/hostedZones";

export default function HostedZonesPage() {
  const router = useRouter();
  const [hostedZones, setHostedZones] = useState<HostedZoneItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<HostedZoneItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingZone, setDeletingZone] = useState<HostedZoneItem | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info" | "warning";
    title?: string;
    message: string;
  } | null>(null);

  // Fetch hosted zones from FastAPI backend
  const fetchZones = useCallback(
    async (page: number, search: string, showRefreshSpinner = false) => {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getHostedZones(page, pageSize, search);
        setHostedZones(response.items || []);
        setTotalItems(response.total || 0);
        setCurrentPage(response.page || page);
      } catch (err: any) {
        if (err instanceof ApiError) {
          setNotification({
            type: "error",
            title: "Failed to load hosted zones",
            message: err.message,
          });
        } else {
          setNotification({
            type: "error",
            title: "Error connecting to server",
            message:
              err?.message || "An unexpected error occurred while fetching hosted zones.",
          });
        }
        setHostedZones([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pageSize]
  );

  // Initial load and whenever page or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchZones(currentPage, searchTerm);
    }, 300); // 300ms debounce for search input

    return () => clearTimeout(timer);
  }, [fetchZones, currentPage, searchTerm]);

  // Handle Search Input changes (resets to page 1)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Handle Manual Refresh
  const handleRefresh = () => {
    fetchZones(currentPage, searchTerm, true);
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(hostedZones.map((z) => z.id));
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
    hostedZones.length > 0 &&
    hostedZones.every((z) => selectedIds.includes(z.id));

  const hasSelection = selectedIds.length > 0;
  const isSingleSelection = selectedIds.length === 1;

  // After creating a zone, refresh the API data and show success alert
  const handleZoneCreated = async (createdZone: HostedZoneItem) => {
    setIsCreateModalOpen(false);

    // Show AWS-style success notification
    setNotification({
      type: "success",
      title: "Successfully created hosted zone",
      message: `Hosted zone "${createdZone.name}" with ID "${createdZone.id}" has been created.`,
    });

    // Refresh data from API
    setCurrentPage(1);
    await fetchZones(1, searchTerm);
  };

  // Get the single selected zone object (for Edit)
  const selectedZone =
    isSingleSelection
      ? hostedZones.find((z) => z.id === selectedIds[0]) ?? null
      : null;

  const handleEditClick = () => {
    if (!selectedZone) return;
    setEditingZone(selectedZone);
    setIsEditModalOpen(true);
  };

  const handleZoneUpdated = async (updatedZone: HostedZoneItem) => {
    setIsEditModalOpen(false);
    setEditingZone(null);
    setSelectedIds([]);
    setNotification({
      type: "success",
      title: "Successfully updated hosted zone",
      message: `Hosted zone "${updatedZone.name}" has been updated.`,
    });
    await fetchZones(currentPage, searchTerm);
  };

  const handleDeleteClick = () => {
    if (!selectedZone) return;
    setDeletingZone(selectedZone);
    setIsDeleteModalOpen(true);
  };

  const handleZoneDeleted = async (deletedId: string, deletedName: string) => {
    setIsDeleteModalOpen(false);
    setDeletingZone(null);
    setSelectedIds([]);
    setNotification({
      type: "success",
      title: "Successfully deleted hosted zone",
      message: `Hosted zone "${deletedName}" has been permanently deleted.`,
    });
    // If we were on a page that only had this one item, step back
    const newPage = hostedZones.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
    await fetchZones(newPage, searchTerm);
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
          title={`Hosted zones (${totalItems})`}
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
            onClick={() => {
              if (selectedIds[0]) router.push(`/hosted-zones/${selectedIds[0]}`);
            }}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            View details
          </Button>

          <Button
            variant="secondary"
            size="md"
            disabled={!isSingleSelection}
            onClick={handleEditClick}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant="secondary"
            size="md"
            disabled={!isSingleSelection}
            onClick={handleDeleteClick}
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
                onChange={handleSearchChange}
                className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
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
        {isLoading ? (
          /* Loading State */
          <div className="py-16 px-4 text-center">
            <Loader2 className="w-6 h-6 text-[#ec7211] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#545b64]">Loading hosted zones...</p>
          </div>
        ) : hostedZones.length > 0 ? (
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
                {hostedZones.map((zone) => {
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
                          href={`/hosted-zones/${zone.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {zone.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-[#16191f]">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-[2px] ${
                            !zone.is_private
                              ? "bg-[#e7f4e4] text-[#1d8102]"
                              : "bg-[#f2f3f3] text-[#545b64]"
                          }`}
                        >
                          {zone.is_private ? "Private" : "Public"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        Route 53
                      </td>
                      <td className="py-2.5 px-4 text-[#16191f] font-mono">
                        {zone.record_count || 2}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64] max-w-xs truncate">
                        {zone.comment || "-"}
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
        {!isLoading && totalItems > 0 && (
          <div className="border-t border-[#eaeded] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#545b64] bg-[#fafafa]">
            <div>
              Showing {startIndex}-{endIndex} of {totalItems} hosted zones
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

      {/* 5. Edit Hosted Zone Modal */}
      <EditHostedZoneModal
        isOpen={isEditModalOpen}
        zone={editingZone}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingZone(null);
        }}
        onSuccess={handleZoneUpdated}
      />

      {/* 6. Delete Hosted Zone Modal */}
      <DeleteHostedZoneModal
        isOpen={isDeleteModalOpen}
        zone={deletingZone}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingZone(null);
        }}
        onSuccess={handleZoneDeleted}
      />
    </div>
  );
}
