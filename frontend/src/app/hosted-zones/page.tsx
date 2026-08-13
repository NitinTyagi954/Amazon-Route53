"use client";

import React from "react";
import Link from "next/link";
import { Globe2, Plus, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HostedZonesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hosted zones"
        description="A hosted zone contains records that tell Route 53 how to respond to DNS queries for a domain, such as example.com, and its subdomains."
        infoTitle="Hosted Zones"
        infoDescription="You can create a public hosted zone to route internet traffic, or a private hosted zone to route traffic within one or more Amazon VPCs."
        actions={
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Create hosted zone
          </Button>
        }
      />

      <Card>
        <div className="py-12 px-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#f2f8fd] border border-[#0972d3]/20 flex items-center justify-center mx-auto mb-4 text-[#0972d3]">
            <Globe2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#16191f] mb-2">
            Hosted zones management
          </h3>
          <p className="text-xs text-[#545b64] leading-relaxed mb-6">
            Hosted Zone CRUD, search, pagination, and record listing capabilities
            will be wired in the upcoming phase.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Dashboard
              </Button>
            </Link>
            <Button variant="primary" size="sm">
              Create hosted zone
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
