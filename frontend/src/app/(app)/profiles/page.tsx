"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, Plus, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ProfilesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profiles"
        description="Route 53 Profiles allow you to specify DNS configurations (such as private hosted zones and Resolver rules) and share them across multiple VPCs and AWS accounts."
        infoTitle="Route 53 Profiles"
        infoDescription="Use Route 53 Profiles to maintain unified DNS architectures across multi-account AWS organizations with AWS RAM integration."
        actions={
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Create profile
          </Button>
        }
      />

      <Card>
        <div className="py-12 px-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#f2f8fd] border border-[#0972d3]/20 flex items-center justify-center mx-auto mb-4 text-[#0972d3]">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#16191f] mb-2">
            Route 53 Profiles
          </h3>
          <p className="text-xs text-[#545b64] leading-relaxed mb-6">
            Multi-account VPC sharing, resolver association profiles, and RAM
            resource sharing will be available in upcoming releases.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Dashboard
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              Create profile
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
