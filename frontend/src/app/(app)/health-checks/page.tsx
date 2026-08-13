"use client";

import React from "react";
import Link from "next/link";
import { Activity, Plus, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HealthChecksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Health checks"
        description="Health checks monitor the health and performance of your web applications, web servers, and other resources."
        infoTitle="Route 53 Health Checks"
        infoDescription="You can configure DNS failover using health checks to automatically direct traffic to backup endpoints when primary resources become unreachable."
        actions={
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Create health check
          </Button>
        }
      />

      <Card>
        <div className="py-12 px-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#f2f8fd] border border-[#0972d3]/20 flex items-center justify-center mx-auto mb-4 text-[#0972d3]">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#16191f] mb-2">
            Health checks monitoring
          </h3>
          <p className="text-xs text-[#545b64] leading-relaxed mb-6">
            Endpoint health checking, CloudWatch alarm integration, and DNS
            failover controls will be enabled in future phases.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Dashboard
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              Create health check
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
