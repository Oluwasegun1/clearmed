"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface CoverageCardProps {
  planName: string;
  hmoName: string;
  membershipNumber: string;
  coverageStartDate: Date;
  coverageEndDate: Date;
  coveragePercentage: number;
  annualLimit: number;
  usedAmount: number;
}

export default function CoverageCard({
  planName,
  hmoName,
  membershipNumber,
  coverageStartDate,
  coverageEndDate,
  coveragePercentage,
  annualLimit,
  usedAmount,
}: CoverageCardProps) {
  const remainingAmount = annualLimit - usedAmount;
  const usagePercentage = (usedAmount / annualLimit) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Shield className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {planName}
            </h3>
            <p className="text-sm text-muted-foreground font-normal">{hmoName}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Membership Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-muted-foreground">Member ID</p>
            </div>
            <p className="text-lg font-bold text-foreground">{membershipNumber}</p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-muted-foreground">
                Coverage Period
              </p>
            </div>
            <p className="text-sm text-foreground">
              {formatDate(coverageStartDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              to {formatDate(coverageEndDate)}
            </p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-muted-foreground">Coverage Rate</p>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {coveragePercentage}%
            </p>
            <Badge className="mt-1 bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
              Active
            </Badge>
          </div>
        </div>

        {/* Annual Limit Progress */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-orange-500/10 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h4 className="text-lg font-semibold text-foreground">
                Annual Benefit Usage
              </h4>
            </div>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {formatCurrency(remainingAmount)} remaining
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Used: {formatCurrency(usedAmount)}
              </span>
              <span className="text-muted-foreground">
                Limit: {formatCurrency(annualLimit)}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-3 bg-muted" />
            <p className="text-xs text-muted-foreground text-center">
              {usagePercentage.toFixed(1)}% of annual limit used
            </p>
          </div>
        </div>

        {/* Coverage Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="font-semibold text-foreground flex items-center">
              <Shield className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
              Covered Services
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Preventive Care</span>
                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                  100%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Specialist Visits</span>
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
                  {coveragePercentage}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Emergency Care</span>
                <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs">
                  {coveragePercentage}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prescription Drugs</span>
                <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs">
                  {coveragePercentage}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
              Cost Information
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deductible</span>
                <span className="text-foreground font-medium">$1,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out-of-Pocket Max</span>
                <span className="text-foreground font-medium">$6,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Care Copay</span>
                <span className="text-foreground font-medium">$25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialist Copay</span>
                <span className="text-foreground font-medium">$50</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
