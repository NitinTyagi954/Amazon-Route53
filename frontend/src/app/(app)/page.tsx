"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe2,
  Activity,
  Share2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const [domainSearch, setDomainSearch] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleDomainCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSearch.trim()) return;
    setSearchResult(
      `Checking availability for ${domainSearch.trim()}... (Available)`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Route 53 Dashboard"
        description="Amazon Route 53 is a highly available and scalable cloud Domain Name System (DNS) web service. It is designed to give developers and businesses an extremely reliable and cost effective way to route end users to Internet applications."
        infoTitle="About Amazon Route 53"
        infoDescription="Amazon Route 53 connects user requests to infrastructure running in AWS (such as Amazon EC2 instances, Elastic Load Balancing load balancers, or Amazon S3 buckets) and can also be used to route users to infrastructure outside of AWS."
      />

      {/* 2. Primary 4-Card Service Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: DNS Management */}
        <Card
          title="DNS management"
          subtitle="Route traffic for your domains with public and private hosted zones"
          headerAction={
            <span className="text-xs bg-[#f2f3f3] text-[#545b64] px-2 py-0.5 rounded font-mono font-medium">
              0 Hosted zones
            </span>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Link
                href="/hosted-zones"
                className="text-xs text-[#0972d3] hover:underline font-semibold flex items-center gap-1"
              >
                View hosted zones <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/hosted-zones">
                <Button variant="primary" size="md">
                  Create hosted zone
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[#545b64] leading-relaxed">
              Create a hosted zone to tell Route 53 how to respond to DNS queries
              for your domain names. You can create public hosted zones for
              internet traffic or private hosted zones for Amazon VPCs.
            </p>
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded-[2px] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-700">
                <span>Public hosted zones</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>Private hosted zones</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>Total DNS records</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Availability Monitoring */}
        <Card
          title="Availability monitoring"
          subtitle="Track health and performance of web applications and endpoints"
          headerAction={
            <span className="text-xs bg-[#f2f3f3] text-[#545b64] px-2 py-0.5 rounded font-mono font-medium">
              0 Health checks
            </span>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Link
                href="/health-checks"
                className="text-xs text-[#0972d3] hover:underline font-semibold flex items-center gap-1"
              >
                View health checks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/health-checks">
                <Button variant="secondary" size="md">
                  Create health check
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[#545b64] leading-relaxed">
              Route 53 monitors the health and performance of your applications.
              You can configure DNS failover to automatically route traffic from
              unhealthy resources to healthy alternate endpoints.
            </p>
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded-[2px] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-700">
                <span>Healthy endpoints</span>
                <span className="font-semibold text-[#1d8102]">0</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>Unhealthy endpoints</span>
                <span className="font-semibold text-[#d13212]">0</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>CloudWatch alarms configured</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Traffic Management */}
        <Card
          title="Traffic management"
          subtitle="Visual DNS routing policies for latency, geo-location, and failover"
          headerAction={
            <span className="text-xs bg-[#f2f3f3] text-[#545b64] px-2 py-0.5 rounded font-mono font-medium">
              0 Policies
            </span>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#545b64]">
                Traffic Flow visual editor
              </span>
              <Button variant="secondary" size="md">
                Create policy
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[#545b64] leading-relaxed">
              Traffic Flow makes it easy to manage complex global routing with an
              intuitive visual editor. Combine latency-based routing,
              geo-proximity, weighted, and multi-value answers in minutes.
            </p>
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded-[2px] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-700">
                <span>Traffic policies</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>Policy records</span>
                <span className="font-semibold text-gray-900">0</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Domain Registration */}
        <Card
          title="Domain registration"
          subtitle="Search, register, or transfer domains directly inside Route 53"
          headerAction={
            <span className="text-xs bg-[#f2f3f3] text-[#545b64] px-2 py-0.5 rounded font-mono font-medium">
              0 Domains
            </span>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#545b64]">
                Over 300 top-level domains (TLDs)
              </span>
              <Button variant="secondary" size="md">
                Register domain
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[#545b64] leading-relaxed">
              Search available domain names and register them with Amazon Route
              53. Automated DNS setup configures hosted zones automatically upon
              registration.
            </p>
            <form onSubmit={handleDomainCheck} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="example.com"
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  className="w-full bg-white border border-[#545b64] rounded-[2px] px-3 py-1 text-xs text-[#16191f] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0972d3] focus:border-[#0972d3]"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Check
              </Button>
            </form>
            {searchResult && (
              <div className="p-2 bg-[#f2f8fd] border border-[#0972d3] text-[#0972d3] text-xs rounded-[2px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#1d8102]" />
                <span>{searchResult}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Informational / Getting Started Guide Section */}
      <Card
        title="Getting started with Amazon Route 53"
        subtitle="Learn about the essential concepts and how to configure your DNS architecture"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-[2px] bg-[#ebf3fb] text-[#0972d3] flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-[#16191f]">
              Configure DNS Routing
            </h4>
            <p className="text-xs text-[#545b64] leading-relaxed">
              Create a public hosted zone for internet-facing domains or a private
              hosted zone for internal VPC communication. Add A, CNAME, MX, and
              TXT records.
            </p>
            <Link
              href="/hosted-zones"
              className="text-xs text-[#0972d3] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Get started with hosted zones &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-[2px] bg-[#ebf3fb] text-[#0972d3] flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-[#16191f]">
              Monitor Endpoint Health
            </h4>
            <p className="text-xs text-[#545b64] leading-relaxed">
              Set up automated health checks that monitor web servers, API
              endpoints, and other resources. Integrate with Amazon CloudWatch for
              instant alerts.
            </p>
            <Link
              href="/health-checks"
              className="text-xs text-[#0972d3] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Set up health checks &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-[2px] bg-[#ebf3fb] text-[#0972d3] flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-[#16191f]">
              Manage Route 53 Profiles
            </h4>
            <p className="text-xs text-[#545b64] leading-relaxed">
              Manage DNS configurations across multiple VPCs and AWS accounts
              using Route 53 Profiles for unified corporate governance.
            </p>
            <Link
              href="/profiles"
              className="text-xs text-[#0972d3] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Explore Profiles &rarr;
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
